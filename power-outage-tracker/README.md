# Ứng dụng Theo dõi Lịch Cúp Điện Bình Thuận

Ứng dụng web theo dõi lịch cúp điện từ các công ty điện lực tỉnh Bình Thuận, cập nhật tự động mỗi 2 giờ.

## Tính năng

- 🔍 Tra cứu lịch cúp điện theo khu vực các Huyện trong tỉnh
- 📱 Giao diện thân thiện, dễ sử dụng trên cả desktop và mobile
- 🔄 Cập nhật dữ liệu tự động mỗi 2 giờ
- 📊 Dữ liệu chính thống từ các công ty điện lực

## Công nghệ sử dụng

- Node.js & Express
- SQLite
- EJS Template
- Bootstrap 5
- Node-cron
- Nodemailer

## Cài đặt

1. Clone repository:
```bash
git clone [repository-url]
cd power-outage-tracker
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Khởi động ứng dụng:
```bash
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## Cấu trúc thư mục

```
power-outage-tracker/
├── data/                  # Thư mục chứa database SQLite
├── src/
│   ├── services/         # Logic xử lý nghiệp vụ
│   ├── views/            # Templates EJS
│   ├── database.js       # Cấu hình và kết nối database
│   ├── index.js          # Entry point
│   └── routes.js         # Định tuyến
├── package.json
└── README.md
```

## Danh sách các khu vực

- Điện lực Phan Thiết (PB0201)
- Điện lực Tuy Phong (PB0202)
- Điện lực Đức Linh (PB0203)
- Điện lực Hàm Tân (PB0205)
- Điện lực Phú Quý (PB0206)
- Điện lực Hàm Thuận Bắc (PB0207)

## Phát triển

Để chạy ứng dụng trong môi trường phát triển với hot-reload:

```bash
npm run dev
```

## Đóng góp

Mọi đóng góp đều được chào đón. Vui lòng tạo issue hoặc pull request để cải thiện ứng dụng.
