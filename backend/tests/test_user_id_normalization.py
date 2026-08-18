from backend.routes.projects import normalize_user_id


def test_normalize_user_id_legacy_frontend_id():
    assert normalize_user_id('user_1') == 'u1'
    assert normalize_user_id('user_2') == 'u2'
    assert normalize_user_id('u1') == 'u1'


def test_normalize_user_id_ignores_blank_and_whitespace():
    assert normalize_user_id('  user_3  ') == 'u3'
    assert normalize_user_id('   ') == ''
