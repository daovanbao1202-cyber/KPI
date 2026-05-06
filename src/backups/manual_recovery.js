import fs from 'fs/promises';
import path from 'path';

async function recover() {
  const filePath = 'c:/Users/daova/.gemini/antigravity/KPI App/data.json';
  const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

  const recoveryMap: Record<number, string> = {
    0: "신규고객확보/New Customer Acquisition/Thu hút khách hàng mới",
    1: "계획달성/Plan Achievement/Đạt mục tiêu kế hoạch",
    2: "미래성장/Future Growth/Tăng trưởng tương lai (Future Growth)",
    3: "미래성장/Future Growth/Tăng trưởng tương lai (Future Growth)",
    4: "이익기여/Profit Contribution/Đóng góp lợi nhuận (Profit Contribution)",
    5: "이익기여/Profit Contribution/Đóng góp lợi nhuận (Profit Contribution)",
    6: "자산관리/Asset Management/Quản lý tài sản",
    7: "자산관리/Asset Management/Quản lý tài sản"
  };

  data.kpiDefs = data.kpiDefs.map((kpi: any, index: number) => {
    if (recoveryMap[index]) {
      return {
        ...kpi,
        customValues: {
          ...kpi.customValues,
          "전략과제(CSF)/NHIỆM VỤ CHIẾN LƯỢC": recoveryMap[index]
        }
      };
    }
    return kpi;
  });

  // Also ensure the custom columns are present
  if (!data.customColumns.includes("전략과제(CSF)/NHIỆM VỤ CHIẾN LƯỢC")) {
    data.customColumns.push("전략과제(CSF)/NHIỆM VỤ CHIẾN LƯỢC");
  }
  if (!data.customColumns.includes("CSF - YẾU TỐ THÀNH CÔNG CỐT LÕI")) {
    data.customColumns.push("CSF - YẾU TỐ THÀNH CÔNG CỐT LÕI");
  }
  if (!data.customColumns.includes("핵심성과지표 (KPI)/CHỈ SỐ HIỆU QUẢ CỐT LÕI")) {
    data.customColumns.push("핵심성과지표 (KPI)/CHỈ SỐ HIỆU QUẢ CỐT LÕI");
  }

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log("Recovery complete!");
}

recover();
