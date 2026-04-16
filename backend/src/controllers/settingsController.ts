import { Request, Response } from 'express';
import Settings from '../models/Settings';

export const getSettings = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Get Settings Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { serverName, transcodingEnabled, hardwareAcceleration, maintenanceMode, language } = req.body;

    // @ts-ignore
    const settings = await Settings.getSettings();

    settings.serverName = serverName ?? settings.serverName;
    settings.transcodingEnabled = transcodingEnabled ?? settings.transcodingEnabled;
    settings.hardwareAcceleration = hardwareAcceleration ?? settings.hardwareAcceleration;
    settings.maintenanceMode = maintenanceMode ?? settings.maintenanceMode;
    settings.language = language ?? settings.language;

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
