import mongoose from 'mongoose';

const uris = [
  // Option 1: authSource = student_election
  'mongodb://nitindivya15_db_user:nitinkumar069984@ac-reezya3-shard-00-00.ibp5of9.mongodb.net:27017,ac-reezya3-shard-00-01.ibp5of9.mongodb.net:27017,ac-reezya3-shard-00-02.ibp5of9.mongodb.net:27017/student_election?ssl=true&replicaSet=atlas-13xo3f-shard-0&authSource=student_election',
  // Option 2: Default authSource (no authSource param)
  'mongodb://nitindivya15_db_user:nitinkumar069984@ac-reezya3-shard-00-00.ibp5of9.mongodb.net:27017,ac-reezya3-shard-00-01.ibp5of9.mongodb.net:27017,ac-reezya3-shard-00-02.ibp5of9.mongodb.net:27017/student_election?ssl=true&replicaSet=atlas-13xo3f-shard-0',
  // Option 3: Username iitknitin06 with no authSource
  'mongodb://iitknitin06:nitinkumar069984@ac-reezya3-shard-00-00.ibp5of9.mongodb.net:27017,ac-reezya3-shard-00-01.ibp5of9.mongodb.net:27017,ac-reezya3-shard-00-02.ibp5of9.mongodb.net:27017/student_election?ssl=true&replicaSet=atlas-13xo3f-shard-0',
  // Option 4: Username nitindivya15_db_user with srv format
  'mongodb+srv://nitindivya15_db_user:nitinkumar069984@ac-reezya3.ibp5of9.mongodb.net/student_election?retryWrites=true&w=majority',
  // Option 5: Username iitknitin06 with srv format
  'mongodb+srv://iitknitin06:nitinkumar069984@ac-reezya3.ibp5of9.mongodb.net/student_election?retryWrites=true&w=majority',
  // Option 6: nitindivya15_db_user with another domain
  'mongodb+srv://nitindivya15_db_user:nitinkumar069984@cluster0.ibp5of9.mongodb.net/student_election?retryWrites=true&w=majority',
];

async function test() {
  for (let i = 0; i < uris.length; i++) {
    console.log(`Testing Option ${i + 1}...`);
    try {
      await mongoose.connect(uris[i], { serverSelectionTimeoutMS: 5000 });
      console.log(`Option ${i + 1} CONNECTED SUCCESSFULLY!`);
      await mongoose.disconnect();
      return;
    } catch (err: any) {
      console.log(`Option ${i + 1} failed:`, err.message);
    }
  }
}

test();
