const path = require('path');
const fs = require('fs-extra');
const cron = require('node-cron');

const clearUploads = async () => {
  try {
    await fs.emptyDir('src/uploads');
    console.log('🧹 Đã xóa sạch thư mục uploads/');
  } catch (err) {
    console.error('❌ Lỗi khi xóa uploads:', err);
  }
};
clearUploads();
cron.schedule('0 0 * * *', () => {
  clearUploads();
}, {
  timezone: 'Asia/Ho_Chi_Minh'
});

module.exports = clearUploads;
