# Riot Log Reader

Đọc **tệp log thô** của VALORANT (dạng Unreal) và Riot Client ngay trong trình duyệt. Chương trình đếm dòng thông tin, cảnh báo, lỗi, dòng trắng và dòng chưa nhận diện. Với mỗi cảnh báo hoặc lỗi, nó giữ số dòng gốc để người dùng có thể tìm lại trong trình soạn thảo.

## Chạy trên máy

1. Tải mã nguồn về, giữ `index.html` và `log-parser.js` cùng thư mục, rồi mở `index.html` bằng Chrome, Edge hoặc Firefox.
2. Chọn một tệp `.log` / `.txt` hoặc kéo thả vào khung trên trang. Trên Windows, mở `%LOCALAPPDATA%\VALORANT\Saved\Logs` để tìm log game.
3. Xem số dòng theo từng mức. Chọn **Tải báo cáo JSON** nếu cần gửi kết quả. Báo cáo xuất số liệu thống kê và tối đa 200 cảnh báo/lỗi đầu tiên, với số dòng, nguồn, mốc thời gian và mức độ. Tên tệp, đường dẫn và nội dung thông báo gốc chỉ ở trên máy.

[Hướng dẫn tìm log của Riot Games](https://support.riotgames.com/en-us/valorant/support-tools/gathering-logs-in-valorant)

## Cách đọc tệp thật

Hàm `readFiles` trong [index.html](index.html) nhận đối tượng `File` từ ô chọn tệp hoặc `event.dataTransfer.files` khi kéo thả. `FileReader.readAsArrayBuffer(file)` đọc các byte từ tệp vừa chọn. [log-parser.js](log-parser.js) dùng `TextDecoder` để giải mã UTF-8 hoặc UTF-16 có BOM, rồi tách từng dòng CRLF, LF hoặc CR. Toàn bộ bước này chạy cục bộ. Tệp tối đa 32 MiB.

| Định dạng | Parser đọc gì? |
| --- | --- |
| Riot Client | Đọc số giây đã trôi qua và mức độ ở đầu dòng phân cách bằng `\|`. Ví dụ tiền tố `000012.345\| WARN\|` được tính là một cảnh báo. |
| Unreal | Đọc tiền tố dạng `[YYYY.MM.DD-HH.MM.SS:mmm][frame]LogCategory: Error:`. Dòng bắt đầu bằng `LogCategory:` cũng được nhận diện khi thiếu dấu thời gian. |
| Dòng tiếp nối hoặc chưa hỗ trợ | Tăng bộ đếm chưa nhận diện. Từ “Error” xuất hiện giữa nội dung thông báo không làm thay đổi mức của dòng. |

Mốc thời gian Unreal được giữ theo tệp gốc. Thời gian tương đối của Riot Client có dấu `+`. Hai loại mốc này không được ghép thành một trục thời gian. Lỗi và cảnh báo là những gì ứng dụng nguồn ghi lại. Việc xác định nguyên nhân sự cố cần thêm ngữ cảnh.

## Kiểm thử

Dùng Node.js 18 trở lên, chạy `node --test log-parser.test.cjs` tại thư mục này. Các bài kiểm tra bao phủ tiền tố raw, mã hóa, thứ tự và số dòng, giới hạn báo cáo và việc loại nội dung tự do khỏi JSON.

Để kiểm tra trực tiếp với một tệp của bạn, chọn tệp rồi đối chiếu số dòng của một cảnh báo với trình soạn thảo. Chọn tệp khác để tạo báo cáo mới.

## Bản đối chiếu JSONL

[Hướng dẫn chạy parser Python và bộ mẫu JSONL](normalized-README.md).

## Tải repo Git độc lập

[Tải riot-log-reader.bundle](https://raw.githubusercontent.com/KhangSuy/docs/main/riot-log-demo/riot-log-reader.bundle), rồi chạy `git clone riot-log-reader.bundle riot-log-reader`. Bản này có nhánh `main`, lịch sử Git riêng, giao diện đọc log và bộ kiểm thử.
