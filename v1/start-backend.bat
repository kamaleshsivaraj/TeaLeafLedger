@echo off
setlocal
set DB_URL=jdbc:postgresql://localhost:5432/tealeafledger
set DB_USERNAME=postgres
set DB_PASSWORD=kamalesh8!
set MONGO_URI=mongodb://kamaleshsivaraj:kamalesh8!@localhost:27017/tealeafledger_seed?authSource=admin
set GMAIL_HOST=smtp.gmail.com
set GMAIL_PORT=587
set GMAIL_USER_MAIL=noreply.kamaleshsivaraj@gmail.com
set GMAIL_USER_PASSWORD=phre hawv lort gion
set GMAIL_FROM_MAIL=noreply.kamaleshsivaraj@gmail.com
set SMS_PROVIDER=
set SMS_API_KEY=
set SMS_SENDER_ID=TeaLeaf
cd /d C:\Users\Kamalesh Sivaraj\Projects\TeaLeafLedger\v1\backend
"C:\Program Files\apache-maven-3.9.9\bin\mvn.cmd" -q spring-boot:run > C:\Users\KAMALE~1\AppData\Local\Temp\opencode\backend.log 2>&1