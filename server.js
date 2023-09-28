const net = require("node:net");
const fs = require("node:fs/promises");
const server = net.createServer();

server.on("connection", (socket) => {
  console.log("New connection");

  let filehandle;
  let fileStream;
  socket.on("data", async (data) => {
    if (!filehandle) {
      socket.pause(); // pause the receiving data from the socket till resume. it was needed coz of the await promises.
      const indexOfDivider = data.indexOf("-------");
      const fileName = data.subarray(10, indexOfDivider).toString("utf-8");

      filehandle = await fs.open(`storage/${fileName}`, "w");
      fileStream = filehandle.createWriteStream();

      // subarray is a method can be used directly on buffer or typedArray
      fileStream.write(data.subarray(indexOfDivider + 7));

      socket.resume(); // resume the receiving data from the socket after writing
      fileStream.on("drain", () => {
        socket.resume();
      });
    } else {
      //writing data to file stream and reading from socket duplex stream
      // fileStream.write(data); // returns false if buffer filled up
      if (!fileStream.write(data)) {
        socket.pause();
      }
    }
  });

  //this end event happens when the client.js ends the socket
  socket.on("end", () => {
    filehandle.close();
    fileStream.close();
    console.log("Connection Ended!!");
  });
});

server.listen(5050, "::1", () => {
  console.log("Uploader server is opened on ", server.address());
});
