from django.shortcuts import render
from django.http import JsonResponse
from .models import Category, Product
from django.db.models import Q


def index(request):
    categories = Category.objects.all()
    products = Product.objects.all()
    
    context = {
        'categories': categories,
        'products': products,
    }
    return render(request, 'shop/index.html', context)


def filter_products(request):
    products = Product.objects.all()
    
    category_id = request.GET.get('category')
    if category_id:
        products = products.filter(category_id=category_id)
    
    price_min = request.GET.get('price_min')
    price_max = request.GET.get('price_max')
    if price_min:
        products = products.filter(price__gte=price_min)
    if price_max:
        products = products.filter(price__lte=price_max)
    
    sort = request.GET.get('sort')
    if sort == 'cheap':
        products = products.order_by('price')
    elif sort == 'expensive':
        products = products.order_by('-price')
    
    search = request.GET.get('search')
    if search:
        products = products.filter(
            Q(name__icontains=search) |
            Q(name__icontains=search.lower()) |
            Q(name__icontains=search.capitalize())
        )
    
    data = [
        {
            'id': p.id,
            'name': p.name,
            'price': str(p.price),
            'image': p.image.url if p.image else '',
            'category': p.category.name,
        }
        for p in products
    ]
    
    return JsonResponse({'products': data, 'count': len(data)})

def cart_add(request, product_id):
    cart = request.session.get('cart', {})
    product_id = str(product_id)
    
    if product_id in cart:
        cart[product_id]['quantity'] += 1
    else:
        product = Product.objects.get(id=product_id)
        cart[product_id] = {
            'name': product.name,
            'price': str(product.price),
            'image': product.image.url if product.image else '',
            'quantity': 1
        }
    
    request.session['cart'] = cart
    return JsonResponse({'success': True, 'count': sum(i['quantity'] for i in cart.values())})


def cart_remove(request, product_id):
    cart = request.session.get('cart', {})
    product_id = str(product_id)
    
    if product_id in cart:
        del cart[product_id]
        request.session['cart'] = cart
    
    return JsonResponse({'success': True, 'count': sum(i['quantity'] for i in cart.values())})


def cart_detail(request):
    cart = request.session.get('cart', {})
    items = [{'id': k, **v} for k, v in cart.items()]
    total = sum(float(i['price']) * i['quantity'] for i in items)

    return JsonResponse({'items': items, 'total': round(total, 2)})

def cart_update(request, product_id):
    cart = request.session.get('cart', {})
    product_id = str(product_id)
    action = request.GET.get('action')
    
    if product_id in cart:
        if action == 'plus':
            cart[product_id]['quantity'] += 1
        elif action == 'minus':
            if cart[product_id]['quantity'] > 1:
                cart[product_id]['quantity'] -= 1
            else:
                del cart[product_id]
        request.session['cart'] = cart
    
    count = sum(i['quantity'] for i in cart.values())
    return JsonResponse({'success': True, 'count': count})