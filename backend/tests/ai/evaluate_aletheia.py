#!/usr/bin/env python3
"""
AletheIA Semantic Evaluation Script - Phase 3: Cognitive Immunity

Uses Vertex AI Gen AI Evaluation to assess AletheIA's clinical analysis quality.
This is a "Unit Test for AI" - validates semantic correctness of risk assessments.

Usage:
    python tests/ai/evaluate_aletheia.py

Exit Codes:
    0: All evaluations passed (quality >= 0.8)
    1: Evaluation failed (quality < 0.8 or errors)
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from google.cloud import aiplatform
from google.cloud.aiplatform import gapic
from app.services.ai.aletheia import AletheiaService


# GDPR Compliance: Force EU region
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "kura-os")
LOCATION = "europe-west1"  # Belgium - GDPR compliant

# Evaluation threshold
QUALITY_THRESHOLD = 0.8


def load_golden_dataset() -> List[Dict[str, Any]]:
    """Load the golden dataset from JSON."""
    dataset_path = Path(__file__).parent / "data" / "golden_dataset.json"
    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["cases"]


async def run_aletheia_analysis(case: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run AletheIA analysis on a golden case.

    Args:
        case: Golden dataset case

    Returns:
        AletheIA analysis result
    """
    service = AletheiaService()

    # Combine context + note for analysis
    full_note = f"{case['input']['patient_context']}\n\n{case['input']['session_note']}"

    try:
        # Call AletheIA (async)
        result = await service.analyze_note(
            note_text=full_note,
            patient_id="test_patient_" + case["id"],
            context={"evaluation_mode": True},
        )
        return result
    except Exception as e:
        print(f"❌ Error analyzing case {case['id']}: {e}")
        return {"error": str(e)}


def create_evaluation_prompt(
    case: Dict[str, Any], aletheia_result: Dict[str, Any]
) -> str:
    """
    Create the prompt for Vertex AI evaluation.

    Returns a structured prompt asking the judge to assess if AletheIA's
    analysis correctly identified risks according to the expected criteria.
    """
    expected = case["expected_evaluation"]

    prompt = f"""You are a clinical safety evaluator. Assess if the AI's risk analysis is clinically appropriate.

**Input Clinical Note:**
{case["input"]["session_note"]}

**AI Risk Analysis:**
- Risk Score: {aletheia_result.get("risk_score", "N/A")}
- Risk Level: {aletheia_result.get("risk_level", "N/A")}
- Flags: {", ".join(aletheia_result.get("flags", []))}
- Recommended Actions: {", ".join(aletheia_result.get("recommended_actions", []))}

**Expected Criteria:**
- Expected Risk Level: {expected["risk_level"]}
- Risk Score Range: {expected.get("risk_score_min", 0)}-{expected.get("risk_score_max", 100)}
- Must Include Flags: {", ".join(expected.get("must_include_flags", []))}
- Must Exclude Flags: {", ".join(expected.get("must_exclude_flags", []))}

**Evaluation Question:**
On a scale of 1-5, how well does the AI's risk assessment align with clinical best practices and the expected criteria?

1 = Completely inappropriate or dangerous
2 = Significant gaps in risk identification  
3 = Adequate but missing important nuances
4 = Good, captures key risks appropriately
5 = Excellent, comprehensive and clinically sound

Provide your rating as a single number (1-5).
"""
    return prompt


async def evaluate_with_vertex_ai(evaluation_prompt: str, case_id: str) -> float:
    """
    Use Vertex AI to evaluate the quality of AletheIA's response.

    Args:
        evaluation_prompt: The structured evaluation prompt
        case_id: Identifier for logging

    Returns:
        Quality score (0.0-1.0)
    """
    # Initialize Vertex AI
    aiplatform.init(project=PROJECT_ID, location=LOCATION)

    # Use Gemini as the judge
    model = aiplatform.GenerativeModel("gemini-1.5-pro")

    try:
        response = model.generate_content(evaluation_prompt)

        # Extract rating (expecting a number 1-5)
        rating_text = response.text.strip()

        # Parse rating
        try:
            rating = float(rating_text)
            if not (1 <= rating <= 5):
                print(f"⚠️  Case {case_id}: Rating {rating} out of range, using 3.0")
                rating = 3.0
        except ValueError:
            print(
                f"⚠️  Case {case_id}: Could not parse rating '{rating_text}', using 3.0"
            )
            rating = 3.0

        # Convert to 0-1 scale
        quality_score = (rating - 1) / 4.0  # Maps 1->0.0, 5->1.0

        print(f"  Case {case_id}: Rating {rating}/5 → Quality {quality_score:.2f}")
        return quality_score

    except Exception as e:
        print(f"❌ Vertex AI evaluation failed for case {case_id}: {e}")
        return 0.0


async def main():
    """Main evaluation workflow."""
    print("🧠 Phase 3: Cognitive Immunity - AletheIA Semantic Evaluation\n")
    print(f"📍 Project: {PROJECT_ID}")
    print(f"📍 Location: {LOCATION} (GDPR compliant)")
    print(f"📏 Quality Threshold: {QUALITY_THRESHOLD}\n")

    # Load golden dataset
    cases = load_golden_dataset()
    print(f"📚 Loaded {len(cases)} golden cases\n")

    results = []

    for case in cases:
        print(f"🔬 Evaluating: {case['id']}")
        print(f"   Expected: {case['expected_evaluation']['risk_level']}")

        # Step 1: Run AletheIA analysis
        aletheia_result = await run_aletheia_analysis(case)

        if "error" in aletheia_result:
            print(f"   ❌ Analysis failed\n")
            results.append({
                "case_id": case["id"],
                "passed": False,
                "quality_score": 0.0,
                "error": aletheia_result["error"],
            })
            continue

        print(
            f"   AletheIA: Risk {aletheia_result.get('risk_score', 'N/A')}, Level {aletheia_result.get('risk_level', 'N/A')}"
        )

        # Step 2: Create evaluation prompt
        eval_prompt = create_evaluation_prompt(case, aletheia_result)

        # Step 3: Evaluate with Vertex AI
        quality_score = await evaluate_with_vertex_ai(eval_prompt, case["id"])

        # Step 4: Check threshold
        passed = quality_score >= QUALITY_THRESHOLD
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {status}\n")

        results.append({
            "case_id": case["id"],
            "passed": passed,
            "quality_score": quality_score,
            "aletheia_result": aletheia_result,
        })

    # Summary
    print("=" * 60)
    print("📊 EVALUATION SUMMARY")
    print("=" * 60)

    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    avg_quality = (
        sum(r["quality_score"] for r in results) / total_count
        if total_count > 0
        else 0.0
    )

    print(f"Passed: {passed_count}/{total_count}")
    print(f"Average Quality: {avg_quality:.2f}")
    print(f"Threshold: {QUALITY_THRESHOLD}")

    # Exit code for CI/CD
    if passed_count == total_count:
        print("\n✅ ALL EVALUATIONS PASSED")
        sys.exit(0)
    else:
        print("\n❌ SOME EVALUATIONS FAILED")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
