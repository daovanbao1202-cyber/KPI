import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data.json');
    const backupPath = 'D:/KPI/KPI App/data.json';
    
    let data;
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      data = JSON.parse(content);
    } catch (e) {
      return NextResponse.json({ error: 'Could not read data.json' }, { status: 500 });
    }

    const recoveryMap = [
      "신규고객확보/New Customer Acquisition/Thu hút khách hàng mới",
      "계획달성/Plan Achievement/Đạt mục tiêu kế hoạch",
      "미래성장/Future Growth/Tăng trưởng tương lai (Future Growth)",
      "미래성장/Future Growth/Tăng trưởng tương lai (Future Growth)",
      "이익기여/Profit Contribution/Đóng góp lợi nhuận (Profit Contribution)",
      "이익기여/Profit Contribution/Đóng góp lợi nhuận (Profit Contribution)",
      "자산관리/Asset Management/Quản lý tài sản",
      "자산관리/Asset Management/Quản lý tài sản"
    ];

    data.kpiDefs = data.kpiDefs.map((kpi: any, index: number) => {
      if (index < recoveryMap.length) {
        return {
          ...kpi,
          customValues: {
            ...(kpi.customValues || {}),
            "전략과제(CSF)/NHIỆM VỤ CHIẾN LƯỢC": recoveryMap[index]
          }
        };
      }
      return kpi;
    });

    const colName = "전략과제(CSF)/NHIỆM VỤ CHIẾN LƯỢC";
    if (!data.customColumns) data.customColumns = [];
    if (!data.customColumns.includes(colName)) {
      data.customColumns.push(colName);
    }

    const dataString = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, dataString, 'utf-8');
    try {
      await fs.writeFile(backupPath, dataString, 'utf-8');
    } catch (e) {}

    return NextResponse.json({ 
      success: true, 
      message: 'Recovery Successful! Please reload your MBO page now.',
      recoveredCount: recoveryMap.length 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
