import os
import unittest
from unittest.mock import patch

from app.orchestrator.state_machine import _database_url_from_env


class DatabaseConfigurationTests(unittest.TestCase):
    def test_pooler_url_takes_precedence_over_database_url(self):
        with patch.dict(
            os.environ,
            {
                "SUPABASE_POOLER_URL": "postgresql://pooler.example.com:5432/postgres",
                "DATABASE_URL": "postgresql://db.example.com:5432/postgres",
            },
        ):
            self.assertEqual(
                _database_url_from_env(),
                "postgresql://pooler.example.com:5432/postgres",
            )

    def test_direct_supabase_url_requires_pooler_url(self):
        with patch.dict(
            os.environ,
            {
                "DATABASE_URL": "postgresql://postgres:password@db.example.supabase.co:5432/postgres",
                "SUPABASE_POOLER_URL": "",
            },
        ):
            with self.assertRaisesRegex(RuntimeError, "SUPABASE_POOLER_URL"):
                _database_url_from_env()

    def test_direct_supabase_url_is_rejected_even_when_mislabeled_as_pooler(self):
        with patch.dict(
            os.environ,
            {
                "SUPABASE_POOLER_URL": "postgresql://postgres:password@db.example.supabase.co:5432/postgres",
                "DATABASE_URL": "sqlite:///./incidents.db",
            },
        ):
            with self.assertRaisesRegex(RuntimeError, "direct IPv6 endpoint"):
                _database_url_from_env()


if __name__ == "__main__":
    unittest.main()