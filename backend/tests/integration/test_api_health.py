from fastapi.testclient import TestClient

from agent.main import create_app


def test_healthz_returns_ok() -> None:
    client = TestClient(create_app())
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
