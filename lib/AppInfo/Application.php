<?php
declare(strict_types=1);

namespace OCA\TalkEnhancer\AppInfo;

use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\Util;

class Application extends App implements IBootstrap {
    public const APP_ID = 'talk_enhancer';

    public function __construct() {
        parent::__construct(self::APP_ID);
    }

    public function register(IRegistrationContext $context): void {
    }

    public function boot(IBootContext $context): void {
        Util::addScript(self::APP_ID, 'talk_enhancer');
        Util::addStyle(self::APP_ID, 'talk_enhancer');
    }
}
