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
const User_1 = __importDefault(require("./src/models/User"));
const dotenv_1 = __importDefault(require("dotenv"));
const googleapis_1 = require("googleapis");
dotenv_1.default.config();
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const user = yield User_1.default.findOne({ googleRefreshToken: { $exists: true } });
    if (!user || !user.googleRefreshToken) {
        console.log('No user with token found.');
        yield mongoose_1.default.disconnect();
        return;
    }
    console.log('Found user:', user.email);
    console.log('Refresh Token:', user.googleRefreshToken.substring(0, 10) + '...');
    const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'http://localhost:5173/google-callback' // Use the one we think is correct
    );
    oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
    try {
        console.log('Attempting to list albums...');
        const url = 'https://photoslibrary.googleapis.com/v1/albums?pageSize=1';
        const res = yield oauth2Client.request({ url });
        console.log('SUCCESS! Albums fetched:', res.data.albums ? 'Yes' : 'No');
    }
    catch (err) {
        console.error('FAILED to list albums.');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        }
        else {
            console.error(err);
        }
    }
    yield mongoose_1.default.disconnect();
});
run().catch(console.error);
