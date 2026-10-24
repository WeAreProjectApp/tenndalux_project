import pytest
from django.core.exceptions import ValidationError

from core_app.models import AboutPage, Category, HomePage, SiteSettings


@pytest.mark.django_db
def test_slug_is_generated_and_unique_for_category():
    c1 = Category.objects.create(name='Kitchen')
    c2 = Category.objects.create(name='Kitchen')

    assert c1.slug == 'kitchen'
    assert c2.slug == 'kitchen-2'


@pytest.mark.django_db
def test_site_settings_singleton_load():
    s1 = SiteSettings.load()
    s2 = SiteSettings.load()
    assert s1.pk == 1
    assert s2.pk == 1
    assert SiteSettings.objects.count() == 1


@pytest.mark.django_db
def test_home_page_singleton_load():
    h1 = HomePage.load()
    h2 = HomePage.load()
    assert h1.pk == 1
    assert h2.pk == 1
    assert HomePage.objects.count() == 1


@pytest.mark.django_db
def test_about_page_singleton_load():
    a1 = AboutPage.load()
    a2 = AboutPage.load()
    assert a1.pk == 1
    assert a2.pk == 1
    assert AboutPage.objects.count() == 1


@pytest.mark.django_db
def test_home_page_refuses_a_second_record_on_validation():
    """Falla si una segunda Home vuelve a validar: al guardarse se escribiría sobre la existente (pk=1)."""
    HomePage.load()

    with pytest.raises(ValidationError) as excinfo:
        HomePage(hero_title='Segunda portada').full_clean()

    assert excinfo.value.message_dict == {
        '__all__': ['Solo puede existir un registro de «home page». Edite el existente.'],
    }
    assert HomePage.objects.count() == 1


@pytest.mark.django_db
def test_home_page_existing_record_still_validates_and_saves():
    """Falla si la restricción de registro único impide editar la Home existente."""
    home = HomePage.load()
    home.hero_title = 'Portada editada'

    home.full_clean()
    home.save()

    assert HomePage.objects.get().hero_title == 'Portada editada'
