from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta

def calculate_recurrence_score(
    confirmed_events_count: int,
    incidents_count: int,
    cleanup_count: int,
    repeat_events_after_cleanup: int,
    unresolved_volume_m3: float
) -> Tuple[float, str, str]:
    """
    Computes a transparent, testable recurrence score (0-100) and classification (LOW, MEDIUM, HIGH)
    plus operational recommendation based on empirical civic infraction metrics.
    """
    score = 0.0

    # Confirmed events contribution (up to 35 pts)
    score += min(confirmed_events_count * 7.0, 35.0)

    # Repeat infractions after a completed cleanup (up to 30 pts - heavy penalty)
    score += min(repeat_events_after_cleanup * 10.0, 30.0)

    # Linked incidents contribution (up to 20 pts)
    score += min(incidents_count * 5.0, 20.0)

    # Active unresolved accumulation volume (up to 15 pts)
    score += min(unresolved_volume_m3 * 1.5, 15.0)

    score = round(min(score, 100.0), 1)

    if score >= 75.0:
        level = "high"
        recommendation = "Erect physical perimeter barrier, improve area illumination, and schedule daily municipal marshal patrols."
    elif score >= 40.0:
        level = "medium"
        recommendation = "Increase weekly mechanical sweeper frequency, issue civic notice to area stakeholders, and audit nearby bulk waste generators."
    else:
        level = "low"
        recommendation = "Standard periodic inspection and routine ward sanitation cycle."

    return score, level, recommendation
