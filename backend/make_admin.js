"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const User_1 = __importDefault(require("./src/models/User"));
// Load env vars
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const makeAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let uri = process.env.MONGO_URI;
        console.log('Mongo URI found:', !!uri);
        if (!uri) {
            console.log('Using default URI: mongodb://localhost:27017/lms');
            uri = 'mongodb://localhost:27017/lms';
        }
        yield mongoose_1.default.connect(uri);
        console.log('Connected to MongoDB');
        const user = yield User_1.default.findOne({});
        console.log('User found:', user ? user.email : 'None');
        if (user) {
            user.role = 'admin';
            yield user.save();
            console.log(`Successfully made user ${user.name} (${user.email}) an admin.`);
        }
        else {
            console.log('No users found.');
        }
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
makeAdmin();
