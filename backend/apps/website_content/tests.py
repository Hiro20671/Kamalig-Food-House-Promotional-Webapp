from io import BytesIO
from PIL import Image
from django.test import TestCase
from django.core.management import call_command
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient


def create_test_image(name='test_dish.png'):
    buf = BytesIO()
    img = Image.new('RGB', (400, 300), color=(246, 201, 40))
    img.save(buf, format='PNG')
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type='image/png')


class KamaligFullStackApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_kamalig')

    def setUp(self):
        self.client = APIClient()

    def authenticate_owner(self):
        res = self.client.post(
            '/api/admin/auth/login/',
            {'username': 'owner', 'password': 'KamaligOwner2026!'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        token = res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_public_endpoints_and_initial_seed(self):
        # Homepage
        res = self.client.get('/api/public/homepage/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['hero_title'], 'Good Food, Great Mood!')
        self.assertEqual(res.data['hero_subtitle'], 'Sarap na Abot-Kaya!')

        # Categories (8 categories from menu)
        res = self.client.get('/api/public/categories/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 8)

        # Products
        res = self.client.get('/api/public/products/')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.data) >= 50)

        # Best Sellers initially empty until owner selects them
        res = self.client.get('/api/public/products/best-sellers/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 0)

        # Location
        res = self.client.get('/api/public/location/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('130 CCF Village, Brgy. Mayao Parada, Lucena City', res.data['address'])

        # SEO endpoints
        self.assertEqual(self.client.get('/robots.txt').status_code, 200)
        self.assertEqual(self.client.get('/sitemap.xml').status_code, 200)

    def test_admin_endpoints_require_auth(self):
        res = self.client.get('/api/admin/dashboard/')
        self.assertEqual(res.status_code, 401)
        res = self.client.patch('/api/admin/homepage/', {'hero_title': 'Hacked'})
        self.assertEqual(res.status_code, 401)

    def test_owner_product_crud_and_image_upload(self):
        self.authenticate_owner()
        cats = self.client.get('/api/public/categories/').data
        rice_cat_id = cats[0]['id']

        img_file = create_test_image('sisig_photo.png')
        create_res = self.client.post(
            '/api/admin/products/',
            {
                'name': 'Special Kamalig Silog',
                'category': rice_cat_id,
                'price': '85.00',
                'description': 'Owner added special silog meal',
                'is_published': 'true',
                'is_featured': 'true',
                'is_best_seller': 'true',
                'main_image': img_file,
                'variants_payload': '[{"variant_group":"Option","variant_name":"Extra Egg","price":15,"is_available":true}]',
            },
            format='multipart',
        )
        self.assertEqual(create_res.status_code, 201)
        prod_id = create_res.data['id']
        self.assertIsNotNone(create_res.data['main_image_url'])
        self.assertEqual(len(create_res.data['variants']), 1)

        # Verify Best Sellers public endpoint now includes this owner-selected product
        bs_res = self.client.get('/api/public/products/best-sellers/')
        self.assertEqual(len(bs_res.data), 1)
        self.assertEqual(bs_res.data[0]['id'], prod_id)

    def test_draft_and_publish_workflow(self):
        self.authenticate_owner()

        # Save a draft on Homepage without publishing
        draft_res = self.client.patch(
            '/api/admin/homepage/',
            {
                'workflow_action': 'save_draft',
                'hero_title': 'Draft Headline Not Live Yet',
            },
            format='multipart',
        )
        self.assertEqual(draft_res.status_code, 200)
        self.assertTrue(draft_res.data['has_unpublished_changes'])

        # Public homepage should still show original published title
        pub_res = self.client.get('/api/public/homepage/')
        self.assertEqual(pub_res.data['hero_title'], 'Good Food, Great Mood!')

        # Now publish the draft
        publish_res = self.client.patch(
            '/api/admin/homepage/',
            {
                'workflow_action': 'publish',
                'hero_title': 'Good Food, Great Mood! - Updated',
            },
            format='multipart',
        )
        self.assertEqual(publish_res.status_code, 200)
        self.assertFalse(publish_res.data['has_unpublished_changes'])

        # Public homepage now reflects the published title
        pub_res_after = self.client.get('/api/public/homepage/')
        self.assertEqual(pub_res_after.data['hero_title'], 'Good Food, Great Mood! - Updated')

    def test_change_password_and_access_code_and_account_crud(self):
        # 1. Verify default 4-digit passcode (1830)
        verify_ok = self.client.post('/api/public/verify-access-code/', {'code': '1830'}, format='json')
        self.assertEqual(verify_ok.status_code, 200)
        self.assertTrue(verify_ok.data['verified'])

        verify_bad = self.client.post('/api/public/verify-access-code/', {'code': '0000'}, format='json')
        self.assertEqual(verify_bad.status_code, 403)

        # Authenticate as owner
        self.authenticate_owner()

        # 2. Update 4-digit passcode to 2468 and verify
        code_res = self.client.patch('/api/admin/auth/access-code/', {'owner_access_code': '2468'}, format='json')
        self.assertEqual(code_res.status_code, 200)
        self.assertEqual(code_res.data['owner_access_code'], '2468')

        verify_new = self.client.post('/api/public/verify-access-code/', {'code': '2468'}, format='json')
        self.assertEqual(verify_new.status_code, 200)

        # 3. Change owner password
        pw_res = self.client.post(
            '/api/admin/auth/change-password/',
            {
                'current_password': 'KamaligOwner2026!',
                'new_password': 'NewKamaligPassword2026!',
                'confirm_password': 'NewKamaligPassword2026!',
            },
            format='json',
        )
        self.assertEqual(pw_res.status_code, 200)

        # Login with new password
        login_res = self.client.post(
            '/api/admin/auth/login/',
            {'username': 'owner', 'password': 'NewKamaligPassword2026!'},
            format='json',
        )
        self.assertEqual(login_res.status_code, 200)

        # 4. Admin Accounts CRUD (Create, Read, Update, Delete)
        create_acc = self.client.post(
            '/api/admin/accounts/',
            {
                'username': 'co_owner',
                'email': 'coowner@kamalig.local',
                'first_name': 'Maria',
                'last_name': 'Santos',
                'role': 'ADMIN',
                'is_active': True,
                'password': 'CoOwnerPassword123!',
            },
            format='json',
        )
        self.assertEqual(create_acc.status_code, 201)
        new_acc_id = create_acc.data['id']

        list_acc = self.client.get('/api/admin/accounts/')
        self.assertEqual(list_acc.status_code, 200)
        self.assertEqual(len(list_acc.data), 2)

        update_acc = self.client.patch(
            f'/api/admin/accounts/{new_acc_id}/',
            {'first_name': 'Maria Clara', 'role': 'OWNER'},
            format='json',
        )
        self.assertEqual(update_acc.status_code, 200)
        self.assertEqual(update_acc.data['first_name'], 'Maria Clara')
        self.assertEqual(update_acc.data['role'], 'OWNER')

        del_acc = self.client.delete(f'/api/admin/accounts/{new_acc_id}/')
        self.assertEqual(del_acc.status_code, 204)

        # Prevent self-deletion
        owner_id = login_res.data['user']['id']
        self_del = self.client.delete(f'/api/admin/accounts/{owner_id}/')
        self.assertEqual(self_del.status_code, 400)

    def test_one_day_sold_out_and_next_day_auto_reset(self):
        from datetime import timedelta
        from django.utils import timezone
        from apps.products.models import Product

        self.authenticate_owner()
        product = Product.objects.filter(is_published=True, is_archived=False).first()

        # 1. Owner marks product as Sold Out Today
        res = self.client.patch(
            f'/api/admin/products/{product.id}/',
            {'mark_sold_out_today': 'true'},
            format='multipart',
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['is_sold_out_today'])

        # 2. Public menu reflects is_sold_out_today=True today
        pub_detail = self.client.get(f'/api/public/products/{product.id}/')
        self.assertEqual(pub_detail.status_code, 200)
        self.assertTrue(pub_detail.data['is_sold_out_today'])

        # 3. Simulate next day (sold_out_date was yesterday) -> automatically resets to Available!
        Product.objects.filter(pk=product.id).update(
            sold_out_date=timezone.localdate() - timedelta(days=1)
        )
        pub_detail_next_day = self.client.get(f'/api/public/products/{product.id}/')
        self.assertEqual(pub_detail_next_day.status_code, 200)
        self.assertFalse(pub_detail_next_day.data['is_sold_out_today'])



