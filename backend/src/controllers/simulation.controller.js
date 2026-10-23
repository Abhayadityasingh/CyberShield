import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import {
  startScenario, getStatus, describeScenarios, clearSimulatedData,
} from '../services/simulation.service.js';

const NOTICE = 'SIMULATION MODE: all events are synthetic and labelled source=simulated.';

export const listScenarios = (_req, res) =>
  res.json({ success: true, simulationMode: true, notice: NOTICE, scenarios: describeScenarios() });

export const runScenario = asyncHandler(async (req, res) => {
  const { scenario, ...params } = req.body;
  const result = await startScenario({ scenario, params });
  res.status(202).json({ success: true, simulationMode: true, notice: NOTICE, ...result });
});

export const simulationStatus = (_req, res) => res.json({ success: true, ...getStatus() });

export const clearData = asyncHandler(async (_req, res) => {
  if (getStatus().running) throw new AppError('Wait for the running simulation to finish', 409);
  const removed = await clearSimulatedData();
  res.json({ success: true, removed });
});