from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.accounts.models import Account, log_audit
from apps.categories.models import Category
from apps.products.models import Product, ProductVariant
from apps.promotions.models import Promotion
from apps.business_information.models import BusinessInformation
from apps.location.models import BusinessLocation
from apps.website_content.models import (
    HomepageContent,
    AboutContent,
    WebsiteSettings,
)


class Command(BaseCommand):
    help = 'Seeds Kamalig Food House initial brand settings, menu categories, products, and owner account.'

    def handle(self, *args, **options):
        # 1. Create or ensure Owner account
        owner_user, created = User.objects.get_or_create(
            username='owner',
            defaults={
                'email': '',
                'first_name': 'Kamalig',
                'last_name': 'Owner',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        if created:
            owner_user.set_password('KamaligOwner2026!')
            owner_user.save()
            self.stdout.write(self.style.SUCCESS('Created default Owner account: username="owner"'))

        Account.objects.get_or_create(
            user=owner_user,
            defaults={
                'role': 'OWNER',
                'permissions': {'all': True},
            },
        )

        # 2. Ensure Singleton CMS records exist
        HomepageContent.objects.get_or_create(id=1)
        AboutContent.objects.get_or_create(id=1)
        BusinessInformation.objects.get_or_create(id=1)
        BusinessLocation.objects.get_or_create(id=1)
        ws, _ = WebsiteSettings.objects.get_or_create(id=1)
        if not ws.logo:
            ws.logo = 'branding/kamalig-logo.png'
            ws.favicon = 'branding/kamalig-logo.png'
            ws.save(update_fields=['logo', 'favicon', 'updated_at'])

        # 3. Initial Promotional Banner
        if not Promotion.objects.exists():
            Promotion.objects.create(
                title='Craving Something Delicious?',
                subtitle='Good Food, Great Mood! • Sarap na Abot-Kaya!',
                description='Discover your next favorite meal at Kamalig Food House! Browse our freshly cooked rice meals, short orders, combo snacks, refreshing drinks, and Kape-Malig coffee.',
                badge_text='KAMALIG SPECIAL',
                button_label='Explore Our Menu',
                button_destination='/menu',
                is_published=True,
                display_order=1,
            )

        # 4. Initial Categories & Menu Catalog
        if Category.objects.exists():
            self.stdout.write(self.style.NOTICE('Categories already exist; skipping initial menu seed.'))
            return

        categories_spec = [
            ('Rice Meals', 'Hearty classic Filipino silog meals, sizzling sisig, burger steaks, and rice plates.'),
            ('Short Orders', 'Flavorful pancit, chami, chamsig, and hot comforting lomi.'),
            ('Combo Snacks', 'Value-packed burger, fries, nachos, and drink combinations.'),
            ('Burgers and Snacks', 'Freshly grilled burgers, crispy fries, loaded nachos, and crunchy shanghai.'),
            ('Soda Pop', 'Sparkling fruit-flavored refreshers available in 12 oz, 16 oz, and 22 oz cups.'),
            ('Yakult Mix', 'Creamy, tangy probiotic Yakult blended with refreshing fruit flavors.'),
            ('Snack Time', 'Two-in-one cup combo featuring your favorite drink below and crispy snack toppings above.'),
            ('Kape-Malig', 'Signature iced coffee and chocolate blends brewed for coffee lovers.'),
        ]

        cat_map = {}
        for idx, (cat_name, cat_desc) in enumerate(categories_spec, start=1):
            cat_map[cat_name] = Category.objects.create(
                name=cat_name,
                description=cat_desc,
                display_order=idx,
                is_published=True,
            )

        # Rice Meals
        rice_meals = [
            ('Pork Sisigilog', 60, 'Crispy, savory pork sisig served with garlic fried rice and fried egg.', True),
            ('Tapsilog', 60, 'Tender marinated beef tapa served with garlic fried rice and sunny-side-up egg.', True),
            ('Tosilog', 60, 'Sweet and savory caramelized pork tocino with garlic rice and fried egg.', False),
            ('Hotsilog', 45, 'Juicy classic red hotdog served with garlic fried rice and egg.', False),
            ('Hungarian Silog', 75, 'Smoky, mildly spicy Hungarian sausage with garlic fried rice and fried egg.', True),
            ('Shanghai Silog', 45, 'Golden crispy lumpiang shanghai rolls paired with garlic rice and fried egg.', False),
            ('Shanghai Rice', 35, 'Crispy lumpiang shanghai served with steamed rice.', False),
            ('Siomai Rice', 35, 'Savory steamed pork siomai topped with chili garlic and served with rice.', False),
            ('Chicken Pastil', 40, 'Flavorful shredded chicken pastil served over warm rice.', False),
            ('Burger Steak Double Patty', 70, 'Two juicy burger patties smothered in rich mushroom gravy with steamed rice.', False),
            ('Burger Steak Single Patty', 55, 'Classic burger patty topped with savory gravy and served with rice.', False),
            ('Chicken Teriyaki', 75, 'Glazed tender chicken teriyaki served with rice.', True),
            ('Extra Rice', 12, 'Additional serving of warm rice.', False),
            ('Siomai', 5, 'Single piece of savory pork siomai.', False),
            ('Solo Sisig', 50, 'Ala carte serving of our signature sizzling pork sisig.', False),
            ('Solo Pastil', 50, 'Ala carte serving of flavorful shredded chicken pastil.', False),
        ]
        for order, (name, price, desc, featured) in enumerate(rice_meals, start=1):
            Product.objects.create(
                name=name,
                category=cat_map['Rice Meals'],
                description=desc,
                price=price,
                is_featured=featured,
                is_best_seller=False,  # Per prompt rule: never claim best seller without owner selection
                is_published=True,
                display_order=order,
            )

        # Short Orders
        short_orders = [
            ('Chami', 90, 'Lucena-style sweet and savory stir-fried miki noodles with meat and vegetables.', True),
            ('Chamsig', 130, 'Our signature Chami topped with crispy, savory pork sisig.', False),
            ('Bihon', 90, 'Classic stir-fried rice noodles tossed with vegetables and savory seasoning.', False),
            ('Miki Bihon', 100, 'Flavorful combination of thick egg noodles and fine bihon noodles.', False),
            ('Lomi', 90, 'Rich, thick, and comforting hot noodle soup loaded with toppings.', False),
        ]
        for order, (name, price, desc, featured) in enumerate(short_orders, start=1):
            Product.objects.create(
                name=name,
                category=cat_map['Short Orders'],
                description=desc,
                price=price,
                is_featured=featured,
                is_best_seller=False,
                is_published=True,
                display_order=order,
            )

        # Combo Snacks
        combo_snacks = [
            ('CS-1: Burger, Fries, Juice', 75, 'Complete snack combo with a juicy burger, crispy fries, and refreshing juice.', False),
            ('CS-2: Burger, Nachos, Juice', 75, 'Snack combo pairing our burger with crunchy nachos and a cold juice drink.', False),
            ('CS-3: Burger, Fries, Nachos, Juice', 100, 'Ultimate snack platter with a burger, crispy fries, loaded nachos, and juice.', True),
        ]
        for order, (name, price, desc, featured) in enumerate(combo_snacks, start=1):
            Product.objects.create(
                name=name,
                category=cat_map['Combo Snacks'],
                description=desc,
                price=price,
                is_featured=featured,
                is_best_seller=False,
                is_published=True,
                display_order=order,
            )

        # Burgers and Snacks
        burgers_snacks = [
            ('Regular Burger', 20, 'Classic soft bun burger with savory patty and dressing.', False),
            ('Kamalig Burger', 30, 'Our signature house burger with upgraded fillings and special sauce.', True),
            ('Sisig Burger', 45, 'Bold fusion burger loaded with savory pork sisig.', False),
            ('Fries', 25, 'Golden crispy French fries.', False),
            ('Nachos', 25, 'Crunchy tortilla chips drizzled with cheese and savory toppings.', False),
            ('Shanghai', 20, 'Crispy golden lumpiang shanghai snack serving.', False),
        ]
        for order, (name, price, desc, featured) in enumerate(burgers_snacks, start=1):
            Product.objects.create(
                name=name,
                category=cat_map['Burgers and Snacks'],
                description=desc,
                price=price,
                is_featured=featured,
                is_best_seller=False,
                is_published=True,
                display_order=order,
            )

        # Soda Pop (8 flavors, sizes 12 oz - 27, 16 oz - 35, 22 oz - 45)
        soda_flavors = [
            'Strawberry',
            'Green Apple',
            'Mango',
            'Blueberry',
            'Lemon',
            'Kiwi',
            'Lychee',
            'Passion Fruit',
        ]
        soda_sizes = [
            ('12 oz', 27),
            ('16 oz', 35),
            ('22 oz', 45),
        ]
        for order, flavor in enumerate(soda_flavors, start=1):
            prod = Product.objects.create(
                name=f"{flavor} Soda Pop",
                category=cat_map['Soda Pop'],
                description=f"Refreshing sparkling {flavor} Soda Pop available in 12 oz, 16 oz, and 22 oz cups.",
                price=27,
                price_note='12 oz ₱27 • 16 oz ₱35 • 22 oz ₱45',
                is_featured=(order == 1),
                is_best_seller=False,
                is_published=True,
                display_order=order,
            )
            for s_idx, (size_label, size_price) in enumerate(soda_sizes, start=1):
                ProductVariant.objects.create(
                    product=prod,
                    variant_group='Size',
                    variant_name=size_label,
                    price=size_price,
                    is_available=True,
                    display_order=s_idx,
                )
            for f_idx, f_name in enumerate(soda_flavors, start=1):
                ProductVariant.objects.create(
                    product=prod,
                    variant_group='Flavor',
                    variant_name=f_name,
                    price=None,
                    is_available=True,
                    display_order=f_idx,
                )

        # Yakult Mix (Flavors specified; price left configurable for owner per prompt rules)
        for order, flavor in enumerate(soda_flavors, start=1):
            prod = Product.objects.create(
                name=f"{flavor} Yakult Mix",
                category=cat_map['Yakult Mix'],
                description=f"Creamy probiotic Yakult blended with sweet {flavor} fruit flavor.",
                price=None,
                price_note='Price configurable by owner',
                is_featured=False,
                is_best_seller=False,
                is_published=True,
                display_order=order,
            )
            for f_idx, f_name in enumerate(soda_flavors, start=1):
                ProductVariant.objects.create(
                    product=prod,
                    variant_group='Flavor',
                    variant_name=f_name,
                    price=None,
                    is_available=True,
                    display_order=f_idx,
                )

        # Snack Time (Flavors: Blue Lemonade, Cucumber, Red Iced Tea, Chocolate, Melon, Four Seasons;
        # Sizes: 16 oz - 35, 22 oz - 45; Toppings: Fries, Nachos, Siomai, Cheese Sticks)
        snack_time_flavors = [
            'Blue Lemonade',
            'Cucumber',
            'Red Iced Tea',
            'Chocolate',
            'Melon',
            'Four Seasons',
        ]
        snack_time_sizes = [
            ('16 oz', 35),
            ('22 oz', 45),
        ]
        snack_time_toppings = [
            'Fries',
            'Nachos',
            'Siomai',
            'Cheese Sticks',
        ]
        for order, flavor in enumerate(snack_time_flavors, start=1):
            prod = Product.objects.create(
                name=f"Snack Time – {flavor}",
                category=cat_map['Snack Time'],
                description=f"Refreshing {flavor} drink paired with your choice of Fries, Nachos, Siomai, or Cheese Sticks topping.",
                price=35,
                price_note='16 oz ₱35 • 22 oz ₱45',
                is_featured=(order == 1),
                is_best_seller=False,
                is_published=True,
                display_order=order,
            )
            for s_idx, (size_label, size_price) in enumerate(snack_time_sizes, start=1):
                ProductVariant.objects.create(
                    product=prod,
                    variant_group='Size',
                    variant_name=size_label,
                    price=size_price,
                    is_available=True,
                    display_order=s_idx,
                )
            for t_idx, topping in enumerate(snack_time_toppings, start=1):
                ProductVariant.objects.create(
                    product=prod,
                    variant_group='Topping',
                    variant_name=topping,
                    price=None,
                    is_available=True,
                    display_order=t_idx,
                )
            for f_idx, f_name in enumerate(snack_time_flavors, start=1):
                ProductVariant.objects.create(
                    product=prod,
                    variant_group='Flavor',
                    variant_name=f_name,
                    price=None,
                    is_available=True,
                    display_order=f_idx,
                )

        # Kape-Malig
        kape_items = [
            ('Iced Coffee', 35, 'Smooth, chilled house blend iced coffee.', False),
            ('Cappuccino', 39, 'Rich espresso blend balanced with creamy foam.', False),
            ('Macchiato', 39, 'Bold coffee layered with sweet creamy notes.', False),
            ('Milk Choco', 39, 'Velvety iced milk chocolate drink.', False),
            ('Mocha', 47, 'Signature fusion of rich coffee and decadent chocolate.', True),
        ]
        for order, (name, price, desc, featured) in enumerate(kape_items, start=1):
            Product.objects.create(
                name=name,
                category=cat_map['Kape-Malig'],
                description=desc,
                price=price,
                is_featured=featured,
                is_best_seller=False,
                is_published=True,
                display_order=order,
            )

        log_audit(owner_user, 'System Seed', 'Initialized Kamalig Catalog', 'Seeded initial categories, menu items, and brand settings.')
        self.stdout.write(self.style.SUCCESS('Successfully seeded Kamalig Food House initial catalog and CMS content!'))

