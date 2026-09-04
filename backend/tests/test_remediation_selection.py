import unittest
from unittest.mock import patch

from app.agents.executor import _execute_direct
from app.schemas.recommendation import Recommendation, RemediationOption


class RemediationSelectionTests(unittest.TestCase):
    def test_approved_restart_option_calls_restart_tool(self):
        recommendation = Recommendation(
            root_cause="GPU worker failure",
            confidence_pct=90,
            options=[
                RemediationOption(
                    action_id="rollback_service",
                    action="Roll back render service",
                    risk_level="low",
                    expected_recovery_min=3,
                ),
                RemediationOption(
                    action_id="restart_service",
                    action="Restart render workers",
                    risk_level="medium",
                    expected_recovery_min=8,
                ),
            ],
            impact_if_ignored="Queue will miss the delivery window.",
            impact_if_acted="Recovery is expected within minutes.",
        )

        with patch("app.agents.executor.rollback_service") as rollback, patch(
            "app.agents.executor.restart_service"
        ) as restart, patch(
            "app.agents.executor._wait_for_recovery", return_value={"queue_depth": 2}
        ):
            report = _execute_direct("incident-1", "render", recommendation, option_index=1)

        restart.assert_called_once_with("render")
        rollback.assert_not_called()
        self.assertEqual(report.action_taken, "Restart render workers")


if __name__ == "__main__":
    unittest.main()