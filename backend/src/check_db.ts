import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Library from './models/Library';
import Media from './models/Media';
import User from './models/User';

dotenv.config();

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected.');

    const users = await User.find({}, 'username email _id');
    console.log('USERS:');
    users.forEach(u => console.log(` - [${u._id}] ${u.username} (${u.email})`));

    const libraries = await Library.find({}, 'name path type userId');
    console.log('LIBRARIES:');
    // @ts-ignore
    libraries.forEach(l => console.log(` - [${l._id}] ${l.name} (${l.type}) Owner:${l.userId} Path:${l.path}`));

    const mediaCount = await Media.countDocuments();
    console.log(`TOTAL MEDIA: ${mediaCount}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDB();
