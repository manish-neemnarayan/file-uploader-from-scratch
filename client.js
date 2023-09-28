const net = require("node:net");
const fs = require("node:fs/promises");
const path = require("node:path");

const clearLine = (dir) => {
  return new Promise((resolve, reject) => {
    process.stdout.clearLine(dir, () => {
      resolve();
    });
  });
};

const moveCursor = (dx, dy) => {
  return new Promise((resolve, reject) => {
    process.stdout.moveCursor(dx, dy, () => {
      resolve();
    });
  });
};

const socket = net.createConnection({ host: "::1", port: 5050 }, async () => {
  const filePath = process.argv[2]; // getting the file name from console
  const fileName = path.basename(filePath);
  const filehandle = await fs.open(filePath, "r");
  const fileStream = filehandle.createReadStream();

  const fileSize = (await fs.stat(filePath)).size;
  let uploadedPercentage = 0;
  let bytesRead = 0;

  // sending the file name to the server
  socket.write(`fileName: ${fileName}-------`);
  // reading data from filestream and writing to the socket duplex stream

  console.log(); // to get a nice log for the progress percentage

  fileStream.on("data", async (data) => {
    if (!socket.write(data)) {
      fileStream.pause();
    }

    bytesRead += data.length;
    let newPercentage = Math.floor((bytesRead / fileSize) * 100);
    if (newPercentage !== uploadedPercentage) {
      uploadedPercentage = newPercentage;
      await moveCursor(0, -1);
      await clearLine(0);
      console.log(`Uploading... ${uploadedPercentage}%`);
    }
  });

  socket.on("drain", () => {
    fileStream.resume();
  });

  fileStream.on("end", () => {
    console.log("File uploaded successfully!");
    socket.end();
  });
});
