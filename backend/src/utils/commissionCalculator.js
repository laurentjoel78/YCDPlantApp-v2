// Commission structure for different consultation types
const COMMISSION_STRUCTURE = {
  virtual: {
    ycdCommission: 0.15, // 15%
    minCommission: 2500, // FCFA
    maxCommission: 15000 // FCFA
  },
  on_site: {
    ycdCommission: 0.20, // 20%
    minCommission: 5000,
    maxCommission: 25000
  },
  emergency: {
    ycdCommission: 0.25, // 25%
    minCommission: 7500,
    maxCommission: 35000
  }
};

/**
 * Calculate commission for a consultation
 * @param {string} consultationType - Type of consultation (virtual, on_site, emergency)
 * @param {number} expertFee - Expert's fee in FCFA
 * @returns {Object} Commission details
 */
exports.calculateCommission = (consultationType, expertFee) => {
  const rates = COMMISSION_STRUCTURE[consultationType] || COMMISSION_STRUCTURE.virtual;
  
  // Calculate base commission
  const baseCommission = expertFee * rates.ycdCommission;
  
  // Apply min/max limits
  const finalCommission = Math.min(
    Math.max(baseCommission, rates.minCommission),
    rates.maxCommission
  );
  
  return {
    commissionRate: rates.ycdCommission,
    minCommission: rates.minCommission,
    maxCommission: rates.maxCommission,
    calculatedCommission: finalCommission,
    effectiveRate: (finalCommission / expertFee).toFixed(4)
  };
};

/**
 * Calculate total cost breakdown for a consultation
 * @param {Object} params - Calculation parameters
 * @param {string} params.consultationType - Type of consultation
 * @param {number} params.expertFee - Expert's fee
 * @param {number} params.duration - Duration in hours (optional)
 * @returns {Object} Cost breakdown
 */
exports.calculateConsultationCost = ({ consultationType, expertFee, duration = 1 }) => {
  const baseExpertFee = expertFee * duration;
  const commission = exports.calculateCommission(consultationType, baseExpertFee);
  
  return {
    expertFee: baseExpertFee,
    ycdCommission: commission.calculatedCommission,
    totalCost: baseExpertFee + commission.calculatedCommission,
    breakdown: {
      expertFeePerHour: expertFee,
      duration,
      commissionRate: commission.effectiveRate,
      baseExpertFee,
      commissionAmount: commission.calculatedCommission
    }
  };
};

/**
 * Estimate potential earnings for an expert
 * @param {Object} params - Calculation parameters
 * @param {number} params.hourlyRate - Expert's hourly rate
 * @param {number} params.hoursPerWeek - Expected hours per week
 * @param {Object} params.consultationMix - Mix of consultation types
 * @returns {Object} Earnings projection
 */
exports.estimateExpertEarnings = ({ hourlyRate, hoursPerWeek, consultationMix = {} }) => {
  const defaultMix = {
    virtual: 0.6, // 60%
    on_site: 0.3, // 30%
    emergency: 0.1 // 10%
  };

  const mix = { ...defaultMix, ...consultationMix };
  let totalEarnings = 0;
  let totalCommissions = 0;
  const breakdown = {};

  for (const [type, percentage] of Object.entries(mix)) {
    const hoursForType = hoursPerWeek * percentage;
    const earnings = hourlyRate * hoursForType;
    const commission = exports.calculateCommission(type, earnings);

    breakdown[type] = {
      hours: hoursForType,
      earnings,
      commission: commission.calculatedCommission
    };

    totalEarnings += earnings;
    totalCommissions += commission.calculatedCommission;
  }

  return {
    weeklyEarnings: totalEarnings,
    monthlyEarnings: totalEarnings * 4,
    yearlyEarnings: totalEarnings * 52,
    weeklyCommissions: totalCommissions,
    monthlyCommissions: totalCommissions * 4,
    yearlyCommissions: totalCommissions * 52,
    effectiveRate: (totalEarnings - totalCommissions) / (hoursPerWeek * hourlyRate),
    breakdown
  };
};

/**
 * Generate commission report for a period
 * @param {Array} transactions - Array of commission transactions
 * @returns {Object} Commission report
 */
exports.generateCommissionReport = (transactions) => {
  const report = {
    totalCommissions: 0,
    byConsultationType: {},
    byExpert: {},
    averageCommissionRate: 0,
    transactionCount: transactions.length
  };

  transactions.forEach(tx => {
    // Aggregate by consultation type
    if (!report.byConsultationType[tx.consultationType]) {
      report.byConsultationType[tx.consultationType] = {
        count: 0,
        totalCommissions: 0
      };
    }
    report.byConsultationType[tx.consultationType].count++;
    report.byConsultationType[tx.consultationType].totalCommissions += tx.commissionAmount;

    // Aggregate by expert
    if (!report.byExpert[tx.expertId]) {
      report.byExpert[tx.expertId] = {
        count: 0,
        totalCommissions: 0
      };
    }
    report.byExpert[tx.expertId].count++;
    report.byExpert[tx.expertId].totalCommissions += tx.commissionAmount;

    report.totalCommissions += tx.commissionAmount;
  });

  report.averageCommissionRate = report.totalCommissions / 
    transactions.reduce((sum, tx) => sum + tx.expertFee, 0);

  return report;
};