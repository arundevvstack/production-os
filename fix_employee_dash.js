const fs = require('fs');

let content = fs.readFileSync('src/app/(dashboard)/dashboard/page.tsx', 'utf8');

if (!content.includes('pendingAssets')) {
  // 1. Add hook to fetch pending assets for employee
  const queryStr = `  const { data: activityLogs } = useSupabaseCollection('ActivityLog', {
    where: { company_id: companyId },
    orderBy: { created_at: 'desc' },
    limit: 10
  });`;

  const newQueryStr = `  const { data: activityLogs } = useSupabaseCollection('ActivityLog', {
    where: { company_id: companyId },
    orderBy: { created_at: 'desc' },
    limit: 10
  });

  const { data: pendingAssets } = useSupabaseCollection('Asset', {
    where: { company_id: companyId }, // We could filter by status but it doesn't have status in this schema version
    orderBy: { created_at: 'desc' }
  });`;
  
  content = content.replace(queryStr, newQueryStr);

  // 2. Add Pending Reviews card to Employee view
  const employeeSectionEnd = `          {/* Secure lock warning for employees */}
          <Card className="border-none shadow-premium rounded-[10px] bg-slate-900 text-white relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            <CardHeader className="p-6 relative z-10">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary animate-pulse" /> Security Clearance Lock
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative z-10 pt-0 space-y-4">
              <p className="text-xs text-slate-400 font-medium prospecting-relaxed">
                As a crew member, your profile is locked under strict tenant isolation policies. You do not have permissions to access:
              </p>
              <ul className="text-[10px] font-black uppercase tracking-wider text-slate-400 space-y-2">
                <li className="flex items-center gap-2 text-rose-400/80"><Ban className="h-3 w-3" /> Financial Ledgers & Cashflow</li>
                <li className="flex items-center gap-2 text-rose-400/80"><Ban className="h-3 w-3" /> Crew Invoicing & GST</li>
                <li className="flex items-center gap-2 text-rose-400/80"><Ban className="h-3 w-3" /> Corporate CRM pipelines</li>
              </ul>
            </CardContent>
          </Card>`;

  const employeeSectionNew = `          {/* Pending Reviews Panel */}
          <Card className="border-none shadow-premium rounded-[10px] bg-white overflow-hidden relative">
            <CardHeader className="p-6 relative z-10 border-b border-slate-100 bg-slate-50">
              <CardTitle className="text-base font-black flex items-center gap-2 text-slate-800">
                <Activity className="h-5 w-5 text-primary" /> Pending Asset Reviews
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              {!pendingAssets || pendingAssets.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center py-8">
                  No assets pending review.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {pendingAssets.slice(0,5).map((asset) => (
                    <div key={asset.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{asset.name}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Awaiting Feedback</p>
                      </div>
                      <Link href={\`/projects/\${asset.project_id}/approvals\`}>
                         <Button size="sm" className="h-8 px-3 rounded-lg font-bold text-[10px] bg-primary hover:bg-primary/95 text-white">Review</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>`;

  content = content.replace(employeeSectionEnd, employeeSectionNew);
  
  fs.writeFileSync('src/app/(dashboard)/dashboard/page.tsx', content);
  console.log('Dashboard updated');
} else {
  console.log('Already updated');
}
