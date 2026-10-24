import { MIN_HISTORY_FOR_KG, RECOMMENDATION_MAP, SKIP_LIKELIHOODS } from './constants'

export function safeRatio(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return null
  }
  return numerator / denominator
}

export function safePercent(numerator, denominator, digits = 1) {
  const ratio = safeRatio(numerator, denominator)
  if (ratio === null) return null
  return Number((ratio * 100).toFixed(digits))
}

export function formatPercent(numerator, denominator, digits = 1) {
  const value = safePercent(numerator, denominator, digits)
  return value === null ? 'N/A' : `${value}%`
}

export function average(values) {
  const nums = values.filter((value) => Number.isFinite(value))
  if (nums.length === 0) return null
  return nums.reduce((sum, value) => sum + value, 0) / nums.length
}

export function dishForecast(feedbackRows) {
  const total = feedbackRows.length
  const ratings = feedbackRows.map((row) => row.rating)
  const lowRatings = feedbackRows.filter((row) => row.rating <= 2).length
  const skipping = feedbackRows.filter((row) =>
    SKIP_LIKELIHOODS.includes(row.likelihood_to_eat),
  ).length
  const reasonCounts = {}
  feedbackRows.forEach((row) => {
    ;(row.reasons || []).forEach((reason) => {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
    })
  })

  const avgRating = average(ratings)
  const lowRatingPct = safePercent(lowRatings, total)
  const skipPct = safePercent(skipping, total)
  const risk = riskLevel(total, lowRatingPct, skipPct)

  return {
    totalResponses: total,
    averageRating: avgRating === null ? null : Number(avgRating.toFixed(2)),
    lowRatingCount: lowRatings,
    lowRatingPct,
    skipCount: skipping,
    skipPct,
    risk,
    reasonCounts,
  }
}

export function riskLevel(totalResponses, lowRatingPct, skipPct) {
  if (!totalResponses) {
    return { level: 'Insufficient', detail: 'Awaiting student responses' }
  }
  const low = lowRatingPct ?? 0
  const skip = skipPct ?? 0
  if (skip >= 35 || low >= 40) {
    return { level: 'High', detail: 'High skip intent or low preference ratings' }
  }
  if (skip >= 20 || low >= 25) {
    return { level: 'Medium', detail: 'Elevated dissatisfaction signals' }
  }
  return { level: 'Low', detail: 'Preference and attendance intent look stable' }
}

export function recommendationsFromReasons(reasonCounts, extra = []) {
  const ranked = Object.entries(reasonCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([reason, count]) => ({
      reason,
      count,
      suggestion: RECOMMENDATION_MAP[reason] || 'Review mess operations for this item.',
    }))
  extra.forEach((item) => {
    if (!ranked.some((row) => row.reason === item.reason)) ranked.push(item)
  })
  return ranked
}

export function estimateWasteKg({ currentSkipPct, historicalLogs, historicalSkipPcts }) {
  if (!historicalLogs || historicalLogs.length < MIN_HISTORY_FOR_KG) {
    return {
      kg: null,
      message: 'Not enough historical data to estimate waste in kg',
    }
  }

  const kgValues = historicalLogs
    .map((log) => Number(log.actual_waste_kg))
    .filter((value) => Number.isFinite(value) && value >= 0)

  if (kgValues.length < MIN_HISTORY_FOR_KG) {
    return {
      kg: null,
      message: 'Not enough historical data to estimate waste in kg',
    }
  }

  const baselineKg = average(kgValues)
  const baselineSkip = average(historicalSkipPcts.filter((value) => Number.isFinite(value)))
  if (baselineKg === null) {
    return {
      kg: null,
      message: 'Not enough historical data to estimate waste in kg',
    }
  }

  let estimated = baselineKg
  if (baselineSkip && baselineSkip > 0 && Number.isFinite(currentSkipPct)) {
    estimated = baselineKg * (currentSkipPct / baselineSkip)
  }

  return {
    kg: Number(Math.max(0, estimated).toFixed(1)),
    message: `Projected from ${kgValues.length} hostel-scoped historical waste logs.`,
  }
}

export function mealLearningStats({ preMeal, kiosk, wasteKg }) {
  const forecast = dishForecast(preMeal)
  const kioskTotal = kiosk.length
  const leftover = kiosk.filter((row) => row.status === 'Leftover').length
  return {
    ...forecast,
    kioskTotal,
    leftoverPct: safePercent(leftover, kioskTotal),
    leftoverCount: leftover,
    cleanPlateCount: kioskTotal - leftover,
    actualWasteKg: Number.isFinite(Number(wasteKg)) ? Number(wasteKg) : null,
  }
}
