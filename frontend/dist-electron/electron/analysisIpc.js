import { runAnalysis, PythonAnalysisError } from './analyzer.js';
function validateRequest(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('Invalid analysis request');
    const request = value;
    const allowed = ['filePath', 'channels', 'algorithm', 'parameters', 'standardize', 'minimumPopulationSize'];
    if (Object.keys(request).some(key => !allowed.includes(key)) ||
        typeof request.filePath !== 'string' || !request.filePath.trim() ||
        !Array.isArray(request.channels) || !request.channels.length ||
        !request.channels.every(channel => typeof channel === 'string' && channel.trim()) ||
        new Set(request.channels).size !== request.channels.length ||
        !['kmeans', 'dbscan', 'hdbscan'].includes(String(request.algorithm)) ||
        (request.standardize !== undefined && typeof request.standardize !== 'boolean') ||
        (request.minimumPopulationSize !== undefined &&
            (typeof request.minimumPopulationSize !== 'number' || !Number.isInteger(request.minimumPopulationSize) || request.minimumPopulationSize < 1))) {
        throw new Error('Invalid analysis request fields');
    }
    const names = request.algorithm === 'kmeans' ? ['n_clusters'] :
        request.algorithm === 'dbscan' ? ['eps', 'min_samples'] : ['min_cluster_size', 'min_samples'];
    if (request.parameters !== undefined && (!request.parameters || typeof request.parameters !== 'object' ||
        Array.isArray(request.parameters) || Object.entries(request.parameters).some(([key, value]) => !names.includes(key) || typeof value !== 'number' || !Number.isFinite(value)))) {
        throw new Error('Invalid algorithm parameters');
    }
    return request;
}
// Use an envelope because Electron does not preserve custom Error properties.
export async function handleAnalysis(request, analyze = runAnalysis) {
    try {
        return { success: true, result: await analyze(validateRequest(request)) };
    }
    catch (error) {
        return { success: false, error: {
                message: error instanceof Error ? error.message : String(error),
                exitCode: error instanceof PythonAnalysisError ? error.exitCode : null,
                signal: error instanceof PythonAnalysisError ? error.signal : null,
                stderr: error instanceof PythonAnalysisError ? error.stderr : '',
            } };
    }
}
