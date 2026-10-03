"""Behavioral contracts for the weekly Silk report task."""

import json
import sys
from datetime import datetime, timezone
from types import ModuleType, SimpleNamespace
from unittest.mock import patch

import pytest
from core_project.tasks import weekly_slow_queries_report
from django.http import HttpResponse
from django.test import override_settings
from django.urls import path

NOW = datetime(2026, 10, 3, 7, 0, tzinfo=timezone.utc)
SQL_MARKER = 'SELECT private_sql_marker FROM customer'
SLOW_PATH_MARKER = 'slow-private@example.invalid'
N1_PATH_MARKER = 'n1-private-token'


urlpatterns = [
    path('api/orders/<int:order_id>/', lambda request: HttpResponse('ok')),
]


class FixtureQuerySet(list):
    """Enough of the Silk queryset boundary for the task's read-only pipeline."""

    def filter(self, *args, **kwargs):
        """Return the prepared source after the task adds a filter."""
        return self

    def select_related(self, *args, **kwargs):
        """Return the prepared source after relation loading is requested."""
        return self

    def order_by(self, *args, **kwargs):
        """Return the prepared source after task ordering is requested."""
        return self

    def annotate(self, *args, **kwargs):
        """Return the prepared source after N+1 counts are annotated."""
        return self

    def count(self):
        """Return the number of prepared source records for the task log."""
        return len(self)

    def __getitem__(self, key):
        """Accept the bounded slice used by the task without changing records."""
        return self


@pytest.fixture
def silk_model_boundary(monkeypatch):
    """Replace only the unavailable Silk ORM boundary with deterministic sources."""
    def install(slow, n1):
        models = ModuleType('silk.models')
        models.SQLQuery = SimpleNamespace(objects=FixtureQuerySet(slow))
        models.Request = SimpleNamespace(objects=FixtureQuerySet(n1))
        monkeypatch.setitem(sys.modules, 'silk.models', models)

    return install


def _report_paths(base_dir):
    report = base_dir / 'logs' / 'silk-reports' / 'silk-report-2026-10-03.log'
    monitoring = base_dir / 'logs' / 'monitoring' / 'silk-2026-10-03-070000.json'
    return report, monitoring


def _run_weekly_report(base_dir, silk_model_boundary, slow, n1):
    silk_model_boundary(slow, n1)
    with override_settings(
        BASE_DIR=base_dir,
        ENABLE_SILK=True,
        ROOT_URLCONF=__name__,
        SLOW_QUERY_THRESHOLD_MS=500,
        N_PLUS_ONE_THRESHOLD=10,
    ), patch('django.utils.timezone.now', return_value=NOW):
        weekly_slow_queries_report.call_local()


def test_weekly_report_preserves_sanitized_silk_metrics(tmp_path, silk_model_boundary):
    """Falla si el reporte semanal pierde métricas al sustituir rutas privadas."""
    slow = [SimpleNamespace(
        request=SimpleNamespace(path=f'/api/orders/902/?email={SLOW_PATH_MARKER}'),
        time_taken=712.0,
        query=SQL_MARKER,
    )]
    n1 = [SimpleNamespace(path=f'/api/orders/903/?token={N1_PATH_MARKER}', qc=18)]

    _run_weekly_report(tmp_path, silk_model_boundary, slow, n1)

    report_path, monitoring_path = _report_paths(tmp_path)
    report = report_path.read_text()
    monitoring = monitoring_path.read_text()
    document = json.loads(monitoring)
    slow_finding = next(item for item in document['findings'] if item['evidence'].get('duration_ms') == 712.0)
    n1_finding = next(item for item in document['findings'] if item['evidence'].get('query_count') == 18)
    assert '[712ms] api/orders/<int:order_id>/' in report
    assert '[18 queries] api/orders/<int:order_id>/' in report
    assert slow_finding['evidence']['route'] == 'api/orders/<int:order_id>/'
    assert n1_finding['evidence']['route'] == 'api/orders/<int:order_id>/'


@pytest.mark.parametrize('private_marker', [SQL_MARKER, SLOW_PATH_MARKER, N1_PATH_MARKER])
def test_weekly_report_redacts_private_silk_marker(tmp_path, silk_model_boundary, private_marker):
    """Falla si el reporte semanal vuelve a serializar SQL o parámetros privados."""
    slow = [SimpleNamespace(
        request=SimpleNamespace(path=f'/api/orders/902/?email={SLOW_PATH_MARKER}'),
        time_taken=712.0,
        query=SQL_MARKER,
    )]
    n1 = [SimpleNamespace(path=f'/api/orders/903/?token={N1_PATH_MARKER}', qc=18)]

    _run_weekly_report(tmp_path, silk_model_boundary, slow, n1)

    report_path, monitoring_path = _report_paths(tmp_path)
    assert private_marker not in report_path.read_text()
    assert private_marker not in monitoring_path.read_text()


def test_weekly_report_uses_unresolved_label_for_unknown_path(tmp_path, silk_model_boundary):
    """Falla si una ruta Silk desconocida vuelve a exponer su path o query privados."""
    slow = [SimpleNamespace(
        request=SimpleNamespace(path=f'/private-source/?token={SLOW_PATH_MARKER}'),
        time_taken=650.0,
        query=SQL_MARKER,
    )]

    _run_weekly_report(tmp_path, silk_model_boundary, slow, [])

    report_path, monitoring_path = _report_paths(tmp_path)
    report = report_path.read_text()
    monitoring = monitoring_path.read_text()
    assert '/unresolved' in report
    assert '/unresolved' in monitoring
    assert SLOW_PATH_MARKER not in report
    assert SLOW_PATH_MARKER not in monitoring


def test_weekly_report_emits_empty_result_document(tmp_path, silk_model_boundary):
    """Falla si un muestreo Silk vacío omite el informe o produce JSON inválido."""
    _run_weekly_report(tmp_path, silk_model_boundary, [], [])

    report_path, monitoring_path = _report_paths(tmp_path)
    report = report_path.read_text()
    document = json.loads(monitoring_path.read_text())
    assert 'No slow queries found this week' in report
    assert 'No N+1 patterns detected this week' in report
    assert document['findings'] == []


def test_disabled_weekly_report_creates_no_output(tmp_path):
    """Falla si Silk desactivado crea archivos de diagnóstico o de monitoreo."""
    with override_settings(BASE_DIR=tmp_path, ENABLE_SILK=False):
        weekly_slow_queries_report.call_local()

    assert not (tmp_path / 'logs' / 'silk-reports').exists()
    assert not (tmp_path / 'logs' / 'monitoring').exists()
