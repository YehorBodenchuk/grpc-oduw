const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = './protos/chat.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

const username = process.argv[2];
if (!username) {
  console.error('Usage: node client.js <username>');
  process.exit(1);
}

const client = new chatProto.ChatService('localhost:50051', grpc.credentials.createInsecure());

const call = client.join({ username });

call.on('data', message => {
  console.log(`[${message.username}]: ${message.text}`);
});

call.on('end', () => {
  console.log('Disconnected from chat.');
  process.exit(0);
});

const stdin = process.openStdin();
stdin.addListener('data', data => {
  const text = data.toString().trim();
  if (text === '/exit') {
    call.end();
    process.exit(0);
  }
  client.sendMessage({ username, text }, (err, response) => {
    if (err) console.error('Error:', err);
  });
});
