import os
import sys

# Ensure this file can import agent_orch.py next to it
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agent_orch import orchestrator

# -------------------------------
# Dummy Email for Testing
# -------------------------------
TEST_EMAIL = """
Hi Team,

This is a reminder that the final build review is scheduled for tomorrow at 3 PM. 
Please prepare your module summaries before the meeting.

Regards,
Alex
"""

# -------------------------------
# Test Queries
# -------------------------------
TEST_QUERIES = [
    "What category is this email?",
    "What do I need to do?",
    "Give me a summary.",
    "Draft a reply.",
    "Explain this email.",
    "Search for emails about build reviews."
]

def print_result(intent, result):
    print("\n==============================")
    print(f"USER INTENT → {intent}")
    print("==============================")

    print("RAW OUTPUT:")
    print(result.get("raw"))

    if result.get("json"):
        print("\nJSON PARSED:")
        print(result.get("json"))

    if result.get("results"):
        print("\nRAG RESULTS:")
        print(result.get("results"))

    print("==============================\n")


def run_tests():
    print("\n===== AGENT ORCHESTRATOR TEST HARNESS =====\n")
    print("Loaded dummy email:\n------------------------------------------")
    print(TEST_EMAIL)
    print("------------------------------------------\n")

    for q in TEST_QUERIES:
        print(f"\n>>> USER QUESTION: {q}")
        result = orchestrator(TEST_EMAIL, q)

        intent = result.get("intent")
        print_result(intent, result)

    print("\n===== TESTING COMPLETE =====\n")


if __name__ == "__main__":
    run_tests()
