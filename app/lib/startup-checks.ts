import { validateEnv, checkProductionEnv, envConfig } from './env-validator';

// Функция для выполнения всех проверок при запуске
export async function performStartupChecks() {
  console.log('🚀 Starting application startup checks...\n');
  
  const checks = {
    environment: false,
    aiConnection: false,
    security: false
  };
  
  // 1. Проверка переменных окружения
  try {
    console.log('1️⃣ Checking environment configuration...');
    validateEnv();
    checkProductionEnv();
    checks.environment = true;
    console.log('✅ Environment configuration: OK\n');
  } catch (error) {
    console.error('❌ Environment configuration: FAILED');
    console.error(error);
    console.log('\n');
  }
  
  // 2. Проверка AI подключения
  try {
    console.log('2️⃣ Checking AI service connection...');
    const aiConfig = envConfig.getAIConfig();
    
    if (aiConfig.provider === 'openrouter') {
      // Проверяем OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${aiConfig.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        checks.aiConnection = true;
        console.log('✅ OpenRouter connection: OK');
      } else {
        throw new Error(`OpenRouter API returned ${response.status}`);
      }
    } else {
      // Проверяем LM Studio
      const response = await fetch(`${aiConfig.baseURL}/models`);
      
      if (response.ok) {
        checks.aiConnection = true;
        console.log('✅ LM Studio connection: OK');
      } else {
        throw new Error(`LM Studio not responding at ${aiConfig.baseURL}`);
      }
    }
    console.log('');
  } catch (error) {
    console.error('❌ AI service connection: FAILED');
    console.error('Please check your AI configuration and ensure the service is running');
    console.log('');
  }
  
  // 3. Проверка настроек безопасности
  console.log('3️⃣ Checking security configuration...');
  const config = envConfig.get();
  
  if (config.NODE_ENV === 'production') {
    const securityIssues = [];
    
    if (!config.ALLOWED_ORIGINS) {
      securityIssues.push('CORS not configured');
    }
    
    if (config.RATE_LIMIT_MAX_REQUESTS > 200) {
      securityIssues.push('Rate limit might be too permissive');
    }
    
    if (securityIssues.length === 0) {
      checks.security = true;
      console.log('✅ Security configuration: OK');
    } else {
      console.log('⚠️ Security configuration: WARNINGS');
      securityIssues.forEach(issue => console.log(`   - ${issue}`));
    }
  } else {
    checks.security = true;
    console.log('✅ Security configuration: OK (development mode)');
  }
  console.log('');
  
  // 4. Итоговый отчет
  console.log('📊 Startup Check Summary:');
  console.log('========================');
  Object.entries(checks).forEach(([check, status]) => {
    console.log(`${status ? '✅' : '❌'} ${check}: ${status ? 'PASSED' : 'FAILED'}`);
  });
  
  const failedChecks = Object.values(checks).filter(status => !status).length;
  
  if (failedChecks > 0) {
    console.log(`\n⚠️ ${failedChecks} check(s) failed. The application may not work correctly.`);
    
    if (config.NODE_ENV === 'production') {
      console.error('\n🛑 Cannot start in production with failed checks!');
      process.exit(1);
    }
  } else {
    console.log('\n✅ All checks passed! Application is ready to start.');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  return checks;
}

// Функция для проверки health статуса (для использования в health check endpoint)
export async function getHealthStatus() {
  const config = envConfig.get();
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    services: {
      ai: 'unknown',
      rateLimit: 'ok',
      search: 'ok'
    },
    features: {
      aiSearch: config.ENABLE_AI_SEARCH,
      webScraping: config.ENABLE_WEB_SCRAPING,
      advancedAnalytics: config.ENABLE_ADVANCED_ANALYTICS
    }
  };
  
  // Проверяем AI сервис
  try {
    const aiConfig = envConfig.getAIConfig();
    if (aiConfig.provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${aiConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      health.services.ai = response.ok ? 'ok' : 'error';
    } else {
      const response = await fetch(`${aiConfig.baseURL}/models`, {
        signal: AbortSignal.timeout(5000)
      });
      health.services.ai = response.ok ? 'ok' : 'error';
    }
  } catch (error) {
    health.services.ai = 'error';
  }
  
  // Если любой из сервисов не работает, меняем общий статус
  if (Object.values(health.services).includes('error')) {
    health.status = 'degraded';
  }
  
  return health;
}