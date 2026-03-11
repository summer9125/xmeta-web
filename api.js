/**
 * XMeta API 客户端
 * 负责与后端 API 通信，获取真实数据
 */

const API_CONFIG = {
    baseUrl: 'https://xmeta.x-metash.cn/api',
    appId: 'a134eb307ad7429a9c5acd057f3de519',
    timeout: 30000
};

/**
 * API 请求封装
 */
async function apiRequest(endpoint, params = {}) {
    const url = new URL(`${API_CONFIG.baseUrl}${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-App-ID': API_CONFIG.appId
            },
            signal: AbortSignal.timeout(API_CONFIG.timeout)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.code !== 0) {
            throw new Error(data.message || 'API 请求失败');
        }
        
        return data.data;
    } catch (error) {
        console.warn(`API 请求失败 (${endpoint}):`, error.message);
        throw error;
    }
}

/**
 * 获取成交记录列表
 */
async function getTransactions(collectionId = null, limit = 100) {
    const params = { limit };
    if (collectionId) params.collection_id = collectionId;
    return await apiRequest('/v1/transactions', params);
}

/**
 * 获取委托记录列表
 */
async function getOrders(collectionId = null, orderType = null, limit = 100) {
    const params = { limit };
    if (collectionId) params.collection_id = collectionId;
    if (orderType) params.type = orderType;
    return await apiRequest('/v1/orders', params);
}

/**
 * 获取藏品列表
 */
async function getCollections(platform = null, limit = 100) {
    const params = { limit };
    if (platform) params.platform = platform;
    return await apiRequest('/v1/collections', params);
}

/**
 * 获取板块行情
 */
async function getSectors() {
    return await apiRequest('/v1/sectors');
}

/**
 * 获取交易统计数据
 */
async function getTransactionStats() {
    return await apiRequest('/v1/transactions/stats');
}

/**
 * 获取市场概览数据
 */
async function getMarketOverview() {
    return await apiRequest('/v1/market/overview');
}

/**
 * 数据缓存管理
 */
const cache = {
    data: {},
    timestamps: {},
    ttl: 60000 // 60 秒缓存
};

/**
 * 带缓存的 API 请求
 */
async function cachedRequest(key, requestFn) {
    const now = Date.now();
    
    // 检查缓存是否有效
    if (cache.data[key] && cache.timestamps[key] && (now - cache.timestamps[key]) < cache.ttl) {
        console.log(`✅ 使用缓存数据：${key}`);
        return cache.data[key];
    }
    
    // 请求新数据
    try {
        const data = await requestFn();
        cache.data[key] = data;
        cache.timestamps[key] = now;
        console.log(`✅ 获取新数据并缓存：${key}`);
        return data;
    } catch (error) {
        // 如果请求失败但有缓存，返回旧缓存
        if (cache.data[key]) {
            console.warn(`⚠️ API 请求失败，使用旧缓存：${key}`);
            return cache.data[key];
        }
        throw error;
    }
}

/**
 * 清除缓存
 */
function clearCache(key = null) {
    if (key) {
        delete cache.data[key];
        delete cache.timestamps[key];
    } else {
        cache.data = {};
        cache.timestamps = {};
    }
}

// 导出所有函数
window.XMetaAPI = {
    config: API_CONFIG,
    request: apiRequest,
    getTransactions,
    getOrders,
    getCollections,
    getSectors,
    getTransactionStats,
    getMarketOverview,
    cachedRequest,
    clearCache
};

console.log('✅ XMeta API 客户端已加载');
