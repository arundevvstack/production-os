import prisma from '@/lib/prisma';

export const crmService = {
  async getPipelineStats(companyId: string) {
    const prospects = await prisma.prospect.findMany({
      where: {
        company_id: companyId,
        is_converted: false,
        NOT: {
          stage: {
            in: ['won', 'lost']
          }
        }
      }
    });

    const totalActiveVal = prospects.reduce((sum: number, p: any) => sum + (p.deal_value || 0), 0);

    const weightedVal = prospects.reduce((sum: number, p: any) => {
      const prob = p.stage === 'new_lead' ? 0.15 :
                   p.stage === 'contacted' ? 0.35 :
                   p.stage === 'proposal_sent' ? 0.65 :
                   p.stage === 'negotiation' ? 0.85 : 0.45;
      return sum + (p.deal_value || 0) * prob;
    }, 0);

    return {
      activeLeadsCount: prospects.length,
      totalPipelineValue: totalActiveVal,
      weightedForecastValue: weightedVal,
    };
  }
};
