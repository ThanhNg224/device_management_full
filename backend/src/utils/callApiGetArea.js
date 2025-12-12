import axios from "axios";
import cron from "node-cron";
import Device from "../model/device.model.js";
import Const from "../res/const.js"

async function fetchDevices() {
  try {
    // 1. Gọi API mới (không cần token nữa)
    const res = await axios.get(Const.urlSWG_UAT + "?swg-fid-skey=" + Const.keySWG_UAT);
    const companies = res.data?.data || [];

    if (!Array.isArray(companies)) throw new Error("API không trả về mảng data");
    console.log(`✅ Nhận ${companies.length} công ty từ API`);

    // 2. Mapper devices từ từng company
    const devices = companies.flatMap((company) =>
      (company.faceTerminalList || []).map((d) => ({
        deviceCode: d.deviceCode,
        deviceName: d.deviceName,
        areaName: d.areaName,
        companyName: company.name,
      }))
    );

    console.log(`📌 Tổng số thiết bị nhận được: ${devices.length}`);

    // 3. Upsert DB
    for (const d of devices) {
      await Device.findOneAndUpdate(
        { deviceCode: d.deviceCode },
        {
          $set: {
            name: d.deviceName || "Unknown",
            location: d.areaName || "Unknown",
            company: d.companyName || "Unknown",
          },
        },
        { upsert: true, new: true }
      );
    }

    // 4. Những thiết bị không còn trong API → set location = "Unknown"
    await Device.updateMany(
      { deviceCode: { $nin: devices.map((d) => d.deviceCode) } },
      { $set: { location: "Unknown" } }
    );

    return devices;
  } catch (err) {
    console.error("❌ Lỗi khi fetch devices:", err.message);
  }
}

// chạy lần đầu khi server start
fetchDevices();

// cron chạy lúc 00h00 mỗi ngày
cron.schedule("0 0 * * *", () => {
  console.log("🔄 Chạy lại fetchDevices lúc 00h00...");
  fetchDevices();
});

export default fetchDevices;


// async function fetchDevices() {
//   try {
//     // 1. Gọi API mới
//     const res = await axios.get("http://192.168.1.150:42080/api/v1/get-companies-info");
//     const companies = res.data?.data || [];

//     if (!Array.isArray(companies)) throw new Error("API không trả về mảng data");
//     console.log(`✅ Nhận ${companies.length} công ty từ API`);

//     // 2. Mapper devices từ từng company
//     const devices = companies.flatMap((company) =>
//       (company.faceTerminalList || []).map((d) => ({
//         deviceCode: d.deviceCode,
//         deviceName: d.deviceName,
//         areaName: d.areaName,
//         companyName: company.name,
//       }))
//     );

//     console.log(`📌 Tổng số thiết bị nhận được: ${devices.length}`);

//     // 3. Upsert vào DB
//     for (const d of devices) {
//       await Device.findOneAndUpdate(
//         { deviceCode: d.deviceCode },
//         {
//           $set: {
//             name: d.deviceName || "Unknown",
//             location: d.areaName || "Unknown",
//             company: d.companyName || "Unknown",
//           },
//         },
//         { upsert: true, new: true }
//       );
//     }

//     // 4. Những thiết bị trong DB nhưng không có trong API → set location = "Unknown"
//     await Device.updateMany(
//       { deviceCode: { $nin: devices.map((d) => d.deviceCode) } },
//       { $set: { location: "Unknown" } }
//     );

//     return devices;
//   } catch (err) {
//     console.error("❌ Lỗi khi fetch devices:", err.message);
//   }
// }

// // chạy lần đầu khi server start
// fetchDevices();

// // cron chạy lúc 00h00 mỗi ngày
// cron.schedule("0 0 * * *", () => {
//   console.log("🔄 Chạy lại fetchDevices lúc 00h00...");
//   fetchDevices();
// });

// export default fetchDevices;



// const Device = require("../model/device.model.js");

// async function clearDevicesWithoutPerformance() {
//   try {
//     const result = await Device.deleteMany({
//       $or: [
//         { lastPerformance: { $exists: false } },
//         { lastPerformance: null },
//         { lastPerformance: {} },
//       ],
//     });
//     console.log(`🗑️ Đã xoá ${result.deletedCount} thiết bị không có lastPerformance`);
//   } catch (err) {
//     console.error("❌ Lỗi khi xoá:", err.message);
//   }
// }

// module.exports = clearDevicesWithoutPerformance;
