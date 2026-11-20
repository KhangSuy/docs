# Đối chiếu log khi game báo lỗi khởi chạy

[parser.py](parser.py) đọc hai nguồn sự kiện JSONL đã chuẩn hóa. Với thời điểm lỗi do người dùng chọn, chương trình tìm các sự kiện trong hai phút trước đó, tính cả hai đầu mốc, rồi xuất danh sách theo thứ tự UTC. Hai sự kiện gần nhau về thời gian chưa đủ để kết luận nguyên nhân lỗi.

## Chạy thử

Trong thư mục này, dùng Python 3.8 trở lên để chạy mẫu giả lập có sẵn. Trên Windows có thể dùng `py` thay cho `python`.

```sh
python parser.py
```

Trong kết quả mẫu, dịch vụ `vgc` dừng lúc **14:02 UTC**, sau đó client báo lỗi khởi chạy lúc **14:03 UTC**. Trường `sample` là `true`. Bạn cũng có thể tải [index.html](normalized-demo.html) về mở trong trình duyệt để thử đổi thời gian và xem báo cáo thay đổi.

## Đọc hai tệp JSONL

Mỗi dòng là một đối tượng JSON. Hai dòng dưới đây là **dữ liệu giả lập**. Lưu dòng đầu vào `client.jsonl` và dòng thứ hai vào `windows.jsonl`.

```jsonl
{"time":"2026-11-20T21:03:00+07:00","event":"launch_failed"}
{"time":"2026-11-20T21:02:00+07:00","event":"service_stopped","service":"vgc"}
```

```sh
python parser.py --client client.jsonl --windows windows.jsonl --incident 2026-11-20T21:03:00+07:00
```

Báo cáo chỉ xuất nguồn, số dòng, thời gian UTC và mã sự kiện cho từng dòng khớp. Các trường bổ sung như token và ghi chú không xuất hiện trong báo cáo. Dòng JSON hỏng, thời gian không hợp lệ và mã sự kiện lạ trong khoảng xét được đếm ở `unreadable_lines`. Dòng trắng và sự kiện có thời gian hợp lệ nằm ngoài khoảng xét được bỏ qua.
