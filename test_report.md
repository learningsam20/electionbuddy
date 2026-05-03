============================= test session starts =============================
platform win32 -- Python 3.12.2, pytest-8.2.2, pluggy-1.5.0
rootdir: E:\Coding\electionassistant
plugins: anyio-4.9.0, Faker-19.13.0, langsmith-0.7.26, asyncio-0.25.3, base-url-2.1.0, playwright-0.5.0, socket-0.7.0, syrupy-4.8.1
asyncio: mode=Mode.STRICT, asyncio_default_fixture_loop_scope=None
collected 9 items

backend\tests\test_api.py ....                                           [ 44%]
backend\tests\test_auth.py ...                                           [ 77%]
backend\tests\test_gemini.py ..                                          [100%]

============================== warnings summary ===============================
backend\database.py:20
  E:\Coding\electionassistant\backend\database.py:20: MovedIn20Warning: The ``declarative_base()`` function is now available as sqlalchemy.orm.declarative_base(). (deprecated since: 2.0) (Background on SQLAlchemy 2.0 at: https://sqlalche.me/e/b8d9)
    Base = declarative_base()

G:\installs\python\Python312\Lib\site-packages\pydantic\_internal\_config.py:291
G:\installs\python\Python312\Lib\site-packages\pydantic\_internal\_config.py:291
  G:\installs\python\Python312\Lib\site-packages\pydantic\_internal\_config.py:291: PydanticDeprecatedSince20: Support for class-based `config` is deprecated, use ConfigDict instead. Deprecated in Pydantic V2.0 to be removed in V3.0. See Pydantic V2 Migration Guide at https://errors.pydantic.dev/2.9/migration/
    warnings.warn(DEPRECATION_MESSAGE, DeprecationWarning)

backend\main.py:198
  E:\Coding\electionassistant\backend\main.py:198: DeprecationWarning: 
          on_event is deprecated, use lifespan event handlers instead.
  
          Read more about it in the
          [FastAPI docs for Lifespan Events](https://fastapi.tiangolo.com/advanced/events/).
          
    @app.on_event("startup")

G:\installs\python\Python312\Lib\site-packages\fastapi\applications.py:4495
  G:\installs\python\Python312\Lib\site-packages\fastapi\applications.py:4495: DeprecationWarning: 
          on_event is deprecated, use lifespan event handlers instead.
  
          Read more about it in the
          [FastAPI docs for Lifespan Events](https://fastapi.tiangolo.com/advanced/events/).
          
    return self.router.on_event(event_type)

backend/tests/test_auth.py::test_registration_flow
backend/tests/test_gemini.py::test_gemini_query_flow
backend/tests/test_gemini.py::test_gemini_history_persistence
  E:\Coding\electionassistant\backend\core\security.py:29: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
    expire = datetime.utcnow() + expires_delta

backend/tests/test_auth.py::test_registration_flow
backend/tests/test_gemini.py::test_gemini_query_flow
backend/tests/test_gemini.py::test_gemini_history_persistence
backend/tests/test_gemini.py::test_gemini_history_persistence
  G:\installs\python\Python312\Lib\site-packages\jose\jwt.py:311: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
    now = timegm(datetime.utcnow().utctimetuple())

backend/tests/test_gemini.py: 18 warnings
  G:\installs\python\Python312\Lib\site-packages\sqlalchemy\sql\schema.py:3596: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
    return util.wrap_callable(lambda ctx: fn(), fn)  # type: ignore

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
======================= 9 passed, 30 warnings in 13.59s =======================
