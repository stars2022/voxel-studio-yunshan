import type {LaunchOptions} from 'playwright';

// Explicit hardware test option for this macOS host. Do not silently report a
// hardware measurement when the browser is using SwiftShader instead.
export function validationBrowserOptions():LaunchOptions {
 return process.argv.includes('--metal')
  ?{headless:true,channel:'chromium',args:['--use-angle=metal']}
  :{headless:true};
}
