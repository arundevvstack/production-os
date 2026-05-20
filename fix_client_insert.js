const fs = require('fs');

const file = 'src/app/(dashboard)/clients/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `      } else {
        const newId = generateId();
        const { data, error } = await supabase.from('Prospect').insert({
          id: newId,
          company_id: companyId,
          ...newClient,
          service_vertical: primaryVertical,
          sub_vertical: allServices.join(', '),
          deal_value: 0,
          stage: 'client', 
        }).select();
        
        if (error) throw error;
        if (data && data.length > 0) {
          setCreatedLeadId(data[0].id);
        }
      }`;

const newCode = `      } else {
        // Let the DB auto-generate the uuid — no manual id needed
        const { data, error } = await supabase.from('Prospect').insert({
          company_id: companyId,
          ...newClient,
          service_vertical: primaryVertical,
          sub_vertical: allServices.join(', '),
          deal_value: 0,
          stage: 'client',
        }).select();

        if (error) throw error;
        if (data && data.length > 0) {
          setCreatedLeadId(data[0].id);
        }
      }`;

if (content.includes('const newId = generateId()')) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(file, content);
  console.log('✓ Fixed handleOnboardClient - removed manual id generation');
} else {
  console.log('Pattern not found - checking content...');
  const idx = content.indexOf('const newId = generateId()');
  console.log('Found at index:', idx);
  console.log('Context:', content.substring(idx - 50, idx + 200));
}
