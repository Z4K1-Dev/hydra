#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { GLMCore } from './core/GLMCore';
import { SessionManager } from './session/SessionManager';
import { ConfigManager } from './config/ConfigManager';

const logo = chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ███████╗ ██████╗ ██████╗  ██████╗ ██████╗ ██╗   ██╗        ║
║   ██╔════╝██╔═══██╗██╔══██╗██╔═══██╗██╔══██╗╚██╗ ██╔╝        ║
║   █████╗  ██║   ██║██████╔╝██║   ██║██████╔╝ ╚████╔╝         ║
║   ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══██╗  ╚██╔╝          ║
║   ██║     ╚██████╔╝██║  ██║╚██████╔╝██║  ██║   ██║           ║
║   ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝           ║
║                                                              ║
║           General Language Model CLI - Unlimited AI          ║
║                    Discussions on Your VPS                    ║
╚══════════════════════════════════════════════════════════════╝
`);

async function main() {
  console.log(logo);

  program
    .name('glm')
    .description('GLM - Unlimited AI discussions on your VPS')
    .version('1.0.0');

  program
    .command('start')
    .description('Start a new discussion session')
    .option('-m, --model <model>', 'AI model to use (gpt-4, claude-3)', 'gpt-4')
    .option('-s, --session <name>', 'Session name')
    .option('-c, --continue', 'Continue from last session')
    .action(async (options) => {
      const glm = new GLMCore();
      await glm.initialize();
      
      if (options.continue) {
        await glm.continueLastSession();
      } else {
        await glm.startNewSession(options.session, options.model);
      }
    });

  program
    .command('sessions')
    .description('List all sessions')
    .action(async () => {
      const sessionManager = new SessionManager();
      const sessions = await sessionManager.listSessions();
      
      console.log(chalk.blue('\n📝 Available Sessions:'));
      sessions.forEach((session, index) => {
        console.log(`${index + 1}. ${session.name} - ${session.model} - ${session.createdAt}`);
      });
    });

  program
    .command('load <session>')
    .description('Load a specific session')
    .action(async (sessionName) => {
      const glm = new GLMCore();
      await glm.initialize();
      await glm.loadSession(sessionName);
    });

  program
    .command('export <session>')
    .description('Export session to file')
    .option('-f, --format <format>', 'Export format (json, md, txt)', 'md')
    .action(async (sessionName, options) => {
      const sessionManager = new SessionManager();
      await sessionManager.exportSession(sessionName, options.format);
    });

  program
    .command('config')
    .description('Configuration management')
    .option('-s, --set <key=value>', 'Set configuration value')
    .option('-g, --get <key>', 'Get configuration value')
    .option('-l, --list', 'List all configuration')
    .action(async (options) => {
      const config = new ConfigManager();
      
      if (options.set) {
        const [key, value] = options.set.split('=');
        await config.set(key, value);
        console.log(chalk.green(`✅ Set ${key} = ${value}`));
      } else if (options.get) {
        const value = config.get(options.get);
        console.log(`${options.get} = ${value}`);
      } else if (options.list) {
        const all = config.list();
        console.log(chalk.blue('\n⚙️  Configuration:'));
        Object.entries(all).forEach(([key, value]) => {
          console.log(`${key} = ${value}`);
        });
      }
    });

  program
    .command('tools')
    .description('Linux tools integration')
    .option('-e, --execute <command>', 'Execute Linux command')
    .option('-l, --list', 'List available tools')
    .action(async (options) => {
      if (options.execute) {
        const glm = new GLMCore();
        await glm.initialize();
        await glm.executeCommand(options.execute);
      } else if (options.list) {
        console.log(chalk.blue('\n🔧 Available Tools:'));
        console.log('- File operations');
        console.log('- System commands');
        console.log('- Network operations');
        console.log('- Process management');
        console.log('- Database operations');
      }
    });

  program
    .command('status')
    .description('Show system status')
    .action(async () => {
      const glm = new GLMCore();
      const status = await glm.getStatus();
      
      console.log(chalk.blue('\n📊 System Status:'));
      console.log(`API Status: ${status.api ? '🟢 Connected' : '🔴 Disconnected'}`);
      console.log(`Database: ${status.database ? '🟢 Ready' : '🔴 Error'}`);
      console.log(`Sessions: ${status.sessionCount}`);
      console.log(`Model: ${status.currentModel}`);
      console.log(`Memory Usage: ${status.memoryUsage}MB`);
    });

  await program.parseAsync();
}

main().catch(console.error);