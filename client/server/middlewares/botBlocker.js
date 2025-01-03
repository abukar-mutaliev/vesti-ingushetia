const blockedBots = [
    '01h4x.com',
    '360Spider',
    '404checker',
    '404enemy',
    '80legs',
    'Abonti',
    'Aboundex',
    'Aboundexbot',
    'Acunetix',
    'ADmantX',
    'adscanner',
    'AdsTxtCrawlerTP',
    'AfD-Verbotsverfahren',
    'AhrefsBot',
    'AIBOT',
    'AiHitBot',
    'Aipbot',
    'Alexibot',
    'ALittle Client',
    'Alligator',
    'AllSubmitter',
    'AlphaBot',
    'Anarchie',
    'Anarchy',
    'Anarchy99',
    'Ankit',
    'Anthill',
    'anthropic-ai',
    'Apexoo',
    'archive.org_bot',
    'arquivo-web-crawler',
    'arquivo.pt',
    'Aspiegel',
    'ASPSeek',
    'Asterias',
    'Atomseobot',
    'Attach',
    'autoemailspider',
    'awario.com',
    'AwarioBot',
    'AwarioRssBot',
    'AwarioSmartBot',
    'BackDoorBot',
    'Backlink-Ceck',
    'backlink-check',
    'BacklinkCrawler',
    'BackStreet',
    'BackWeb',
    'Badass',
    'Bandit',
    'Barkrowler',
    'BatchFTP',
    'Battleztar Bazinga',
    'BBBike',
    'BDCbot',
    'BDFetch',
    'BetaBot',
    'Bigfoot',
    'Bitacle',
    'Black Hole',
    'Blackboard',
    'BlackWidow',
    'BLEXBot',
    'Blow',
    'BlowFish',
    'Boardreader',
    'Bolt',
    'BotALot',
    'Brandprotect',
    'Brandwatch',
    'Buck',
    'Buddy',
    'BuiltBotTough',
    'BuiltWith',
    'Bullseye',
    'BunnySlippers',
    'BuzzSumo',
    'Bytespider',
    'cah.io.community',
    'Calculon',
    'CATExplorador',
    'CazoodleBot',
    'CCBot',
    'Cegbfeieh',
    'CensysInspect',
    'ChatGPT-User',
    'check1.exe',
    'CheeseBot',
    'CherryPicker',
    'CheTeam',
    'ChinaClaw',
    'Chlooe',
    'Citoid',
    'Claritybot',
    'clark-crawler',
    'Cliqzbot',
    'Cloud mapping',
    'coccocbot',
    'Cocolyzebot',
    'CODE87',
    'Cogentbot',
    'cognitiveseo',
    'cohere-ai',
    'Collector',
    'com.plumanalytics',
    'Copier',
    'CopyRightCheck',
    'Copyscape',
    'Cosmos',
    'Craftbot',
    'crawl.sogou.com',
    'crawler.feedback',
    'crawler4j',
    'Crawling at Home Project',
    'CrazyWebCrawler',
    'Crescent',
    'CrunchBot',
    'CSHttp',
    'Curious',
    'Custo',
    'CyotekWebCopy',
    'DatabaseDriverMysqli',
    'DataCha0s',
    'dataforseo.com',
    'dataforseobot',
    'DBLBot',
    'demandbase-bot',
    'Demon',
    'Deusu',
    'Devil',
    'Digincore',
    'DigitalPebble',
    'DIIbot',
    'Dirbuster',
    'Disco',
    'Discobot',
    'Discoverybot',
    'Dispatch',
    'DittoSpyder',
    'DnBCrawler-Analytics',
    'DnyzBot',
    'DomainAppender',
    'DomainCrawler',
    'Domains Project',
    'DomainSigmaCrawler',
    'domainsproject.org',
    'DomainStatsBot',
    'DomCopBot',
    'Dotbot',
    'Download Wonder',
    'Dragonfly',
    'Drip',
    'DSearch',
    'DTS Agent',
    'EasyDL',
    'Ebingbong',
    'eCatch',
    'ECCP/1.0',
    'Ecxi',
    'EirGrabber',
    'EMail Siphon',
    'EMail Wolf',
    'EroCrawler',
    'evc-batch',
    'Evil',
    'Exabot',
    'Express WebPictures',
    'ExtLinksBot',
    'Extractor',
    'ExtractorPro',
    'Extreme Picture Finder',
    'EyeNetIE',
    'Ezooms',
    'FacebookBot',
    'facebookscraper',
    'FDM',
    'FemtosearchBot',
    'FHscan',
    'Fimap',
    'FlashGet',
    'Flunky',
    'Foobot',
    'Freeuploader',
    'FrontPage',
    'Fuzz',
    'FyberSpider',
    'Fyrebot',
    'G-i-g-a-b-o-t',
    'GalaxyBot',
    'Genieo',
    'GermCrawler',
    'Getintent',
    'GetRight',
    'GetWeb',
    'Gigabot',
    'Go-Ahead-Got-It',
    'Go!Zilla',
    'gopher',
    'Gotit',
    'GoZilla',
    'GPTBot',
    'Grabber',
    'openai',
    'openai.com',
];

function botBlocker(req, res, next) {
    const userAgent = req.headers['user-agent'] || '';
    const isBotBlocked = blockedBots.some((bot) => userAgent.includes(bot));

    if (isBotBlocked) {
        return res.status(403).send('Access Forbidden');
    }
    next();
}

module.exports = botBlocker;
