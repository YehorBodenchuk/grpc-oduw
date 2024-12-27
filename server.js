const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = './protos/chat.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

const clients = [];

function sendMessage(call, callback) {
  const message = call.request;
  console.log(`[${message.username}]: ${message.text}`);

  clients.forEach(client => client.write(message));
  callback(null, {});
}

function join(call) {
  console.log(`User joined: ${call.request.username}`);
  clients.push(call);

  call.write({ username: 'Server', text: `Welcome, ${call.request.username}!` });

  call.on('end', () => {
    console.log(`User left: ${call.request.username}`);
    const index = clients.indexOf(call);
    if (index !== -1) clients.splice(index, 1);
    call.end();
  });
}

const server = new grpc.Server();
server.addService(chatProto.ChatService.service, { sendMessage, join });

const PORT = 50051;
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  server.start();
});
