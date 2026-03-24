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
const Media_1 = __importDefault(require("./src/models/Media"));
const Library_1 = __importDefault(require("./src/models/Library"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const debugStats = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/local-media-server';
        console.log('Connecting to:', uri);
        yield mongoose_1.default.connect(uri);
        console.log('Connected.');
        const userCount = yield User_1.default.countDocuments();
        const mediaCount = yield Media_1.default.countDocuments();
        const libraryCount = yield Library_1.default.countDocuments();
        const mediaTypes = yield Media_1.default.aggregate([
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);
        const users = yield User_1.default.find({}, 'email role');
        console.log('--- DB STATS ---');
        console.log('Users:', userCount);
        users.forEach(u => console.log(` - ${u.email} (${u.role})`));
        console.log('Libraries:', libraryCount);
        console.log('Media Items:', mediaCount);
        console.log('Media Breakdown:', mediaTypes);
        console.log('----------------');
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
debugStats();
