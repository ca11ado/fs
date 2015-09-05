/**
 * Chat version 2.0.5
 * Created by tos on 08.12.14.
 */

'use strict';

console.log('%cChat Version 2.0.3', 'color:yellow');
$(document).ready(function () {
    /* Зависимости */
    if (!Base64) {
        console.log('%cError >>> не определена глобальная функция Base64', 'color:red');
    }
});

window.Chat_Init = function() {
    console.log('%cStart Chat Initialization', 'color:green');
    if (window.testTokenToUnsub) {
        for (var i=0; i < window.testTokenToUnsub.length; i++) {
            script_PubSub.unsubscribe(testTokenToUnsub[i]);
        }
    }
    var tokenToUnsub = [];

    var USER_OBJECT = (function(){
        var o;

        function setNotAuth() {
            o = '%notAuth';
        }

        function update(newObj){
            o = newObj;
            if (!o || o.length === 0) {
                setNotAuth();
            }
        }

        function get() {
            return o;
        }

        function checkAuth() {
            //return (o && o != 'notAuth');
            return o !== '%notAuth';
        }

        /**
         *
         * @param setting
         * @param state {boolean}
         */
        function setSettingState(setting,state) {
            console.log('setSettingState setting %o state %o', setting, state);
            if (o && o.settings.hasOwnProperty(setting)) {
                o.settings[setting] = state;
            }
        }

        function getSettingState(setting) {
            return (o && o.settings) ? o.settings[setting] : undefined;
        }

        return {
            get: get,
            update: update,
            setNotAuth : setNotAuth,
            checkAuth : checkAuth,
            getSettingState: getSettingState,
            setSettingState:    setSettingState
        };
    })();

    var KeyBind = (function(){
        var keysList = {
            'tab': 9
        };

        smileKey('.chat_input', 'tab', '.smiles.chat_pic');

        function smileKey(focusEl, key, elementClick) {
            var smilesActive;
            if (keysList.hasOwnProperty(key)) {
                    $(document).on('keydown', function(e){
                        if (!smilesActive) {
                            if ($(document.activeElement).filter(focusEl).length > 0 && e.keyCode == keysList[key]) {
                                e.preventDefault();
                                $(elementClick).click();
                                smilesActive = true;
                            }
                        } else {
                            e.preventDefault();
                            $(elementClick).click();
                            smilesActive = false;
                        }
                    });

            }
        }

        return {

        };

    })();

    /**
     * Функция, отвечающая за галерею чата
     * types: pic, video, quote
     */
    window.GalleryOnPage = (function(){
        var $mainRoomBlock = $('.main_room_block'),
            $minimizeButton = $mainRoomBlock.find('.minimize'),
            $galleryBlock = $('.gallery_block'),
            $galleryWrapParent = $('.chat_gallery_preview'),
            $galleryWrap_MCSB = $('.chat_gallery_preview_wrapper'),
            $galleryThumbs = $('.chat_gallery_thumbnails'),
            $galleryMainPlayerWrap = $('.player_block'),
            $addLinkPopup = $('.add_link_popup'),
            $addLinkPopupBtnAdd = $addLinkPopup.find('.blue_but'),
            $addLinkPopupBtnRm = $addLinkPopup.find('.red_but'),
            $addLinkInput = $addLinkPopup.find('input');

        initScrollForGallery();// init scroll in gallery
        var $galleryWrap_Content = $galleryWrap_MCSB.find('.mCSB_container');

        $galleryBlock.html(getCapMainPlayerHtml());

        clickOnThumb();
        clickOnLike();
        clickOnMinButton();
        clickOnAddBtn();
        clickOnRmBtn();
        hoverGalleryBlock();
        clickOnGalleryBlock();
        hoverGalleryThumb();

        //Private
        var messageId,prevId;

        function clickOnLike() {
            $mainRoomBlock.on('click', '.gallery_content_likes', function () {
                $(this).addClass('active');
                script_BE.sendToPHP('chat/like', {msgId:$(this).data('msgid'),channel:ChatInstances.getChatChannels(ChatInstances.getChatNames()[0])});
            });
        }

        function clickOnGalleryBlock() {
            // replace sample to real html block
            $galleryWrap_Content.on('click', '.ch_gallerySample', function () {
                $(this).replaceWith($(script_AdditionalContent.getGalleryBlockPlayerHtml($(this).data('id'))));
            });
        }
        function initScrollForGallery() {
            if ($galleryWrap_MCSB.length > 0) {
                if (!$galleryWrap_MCSB.hasClass('mCustomScrollbar')) {
                    $galleryWrap_MCSB.mCustomScrollbar({
                        axis: "x",
                        theme: "light",
                        scrollInertia: 100,
                        advanced:{autoExpandHorizontalScroll:true},
                        mouseWheel: {
                            scrollAmount: 350,
                            preventDefault: true
                        }
                    });
                } else {
                    console.log('%cERROR >>> скролл галереи уже был инициализирован', 'color:red');
                }
            }
        }


        function hoverGalleryBlock() {
            var id;
            $galleryWrap_Content.on('mouseenter', '.gallery_block' ,function () {
                id = transformIdString('thumb',$(this).attr('id'));
                $('#'+transformIdString('thumb',id)).removeClass('new').addClass('hovered');

                script_intStorage.galleryAddWatchedBlock(id);
            });
            $galleryWrap_Content.on('mouseleave', '.gallery_block' ,function () {
                id = transformIdString('thumb',$(this).attr('id'));
                $('#'+transformIdString('thumb',id)).removeClass('hovered');
            });
        }
        function hoverGalleryThumb() {
            var elClass;
            $galleryThumbs.on('mouseenter', 'div' ,function () {
                elClass = $(this).attr('id');
                if (elClass) {
                    messageId = transformIdString('thumb', elClass);
                    prevId = transformIdString('preview',messageId);
                    $('#'+prevId).addClass('hovered');
                    $('#' + messageId).addClass('t_hovered');
                }
            });
            $galleryThumbs.on('mouseleave', 'div' ,function () {
                if (elClass) {
                    $('#'+prevId).removeClass('hovered');
                    $('#' + messageId).removeClass('t_hovered');
                }
            });
        }
        function clickOnThumb() {
            $galleryThumbs.on('click', 'div', function () {
                var id = $(this).removeClass('new').attr('id');
                if (id) {
                    id = transformIdString('', id);
                    script_intStorage.galleryAddWatchedBlock(id);
                    $galleryWrap_MCSB.mCustomScrollbar('scrollTo', '#'+ transformIdString('preview',id),{scrollInertia:10});
                }
                if ($galleryMainPlayerWrap.hasClass('active')) {
                    // stretch videoPlayer
                    $galleryWrapParent.css('visibility', 'visible');
                    $galleryMainPlayerWrap.children('object').attr('width', '210')
                        .attr('height', 150);
                    $galleryMainPlayerWrap.removeClass('active');
                    $minimizeButton.addClass('active');
                }
            });
        }

        function clickOnMinButton() {
            var $galleryMainPlayerChildren;
            if ($galleryWrapParent.attr('visability')) {
                $galleryWrapParent.css('visibility', 'hidden').removeAttr('visability');
            }

            $mainRoomBlock.on('click', '.minimize', function () {
                $galleryMainPlayerChildren = $galleryMainPlayerWrap.children();
                if ($minimizeButton.hasClass('active')) {
                    $galleryWrapParent.css('visibility', 'hidden');
                    $galleryMainPlayerWrap
                        .children('iframe').attr('width', '789').attr('height', 444)
                        .end()
                        .children('object').attr('width', '789').attr('height', 444)
                        .children('embed').attr('width', '789').attr('height', 444);
                }
                else {
                    $galleryWrapParent.css('visibility', 'visible');
                    $galleryMainPlayerWrap
                        .children('object').attr('width', '210').attr('height', 199);
                }
                $galleryMainPlayerWrap.toggleClass('active');
                $minimizeButton.toggleClass('active');
            });
        }

        function clickOnAddBtn() {
            $addLinkPopupBtnAdd.on('click', function(e){
                e.preventDefault();
                var link = $addLinkInput.val(),
                    roomId = ChatInstances.getFirstChatInstance().param.roomId;
                if (link !== '' && link !== ' ') {
                    script_BE.sendToPHP('room/privateRoom/share', {'room':roomId,'link':link});
                    $addLinkInput.val('');
                } else {
                    script_error_popup('Не задана ссылка');
                }
            });
        }

        function clickOnRmBtn() {
            $addLinkPopupBtnRm.on('click', function (e) {
                e.preventDefault();
                var roomId = ChatInstances.getFirstChatInstance().param.roomId;
                var link = 'http://dev.funstream.tv/images/mainPlayer_sample_min.png';
                script_BE.sendToPHP('room/privateRoom/share', {'room':roomId,'link':link});
            });
        }

        /**
         * Превращает id сообщения в id блока превью или миниатюры, либо обратно в id сообщения
         * @param blockType (preview || thumb)
         * @param idString (id || string_id)
         */
        function transformIdString(blockType, idString){
            var result,
                prefix;
            if (blockType === 'preview'){
                prefix = 'ch_previewId_';
            } else if (blockType === 'thumb') {
                prefix = 'ch_thumbId_';
            } else {
                prefix = 'unkonwn';
            }
            //console.log('transformIdString blockType %o prefix %o', blockType, prefix);
            if (/^\d*$/.test(idString)) {
                result = prefix + idString;
            } else {
                result = idString.substring(idString.lastIndexOf('_') + 1);
            }
            return result;
        }

        function getCapMainPlayerHtml(pageOwner) {
            var text;
            if (pageOwner) {
                text = 'вы можете добавить видео, картинку или трансляцию в комнату или трансляцию в комнату для совместного просмотра.<br\/>Нажмите на  <img class="img_2" src="images\/icon_play_cap_mini.png" alt="play" width="6" height="11" \/>  под чатом.';
            } else {
                text = 'Автор может добавить видео, картинку или трансляцию в комнату для совместного просмотра.';
            }
            return  '<div class="room_cap">' +
                    '<div class="text_wrapper">' +
                    '<img src="images\/icon_play_cap.png" class="img_1" alt="play" width="25" height="36" \/> <br\/>' +
                    text +
                    '<\/div>' +
                    '<\/div>';
        }

        function BlockInGallery(msgId,userName,likes,type,content) {
            this.prevId = transformIdString('preview', msgId);
            this.thumbId = transformIdString('thumb', msgId);
            this.msgId = msgId;
            this.typeOfContent = type;

            this.toHTML_preview = function(){
                return      '<div id="' + this.prevId + '" class="gallery_block">' +
                                '<div class="gallery_block_header">' +
                                    /*'<img width="30" height="30" src="/images/user_message_avatar.png">'+*/
                                    '<a href="#">' + userName + '</a>' +
                                '<\/div>' +
                                '<div class="gallery_content">' +
                                    content +
                                '<\/div>' +
                                '<div class="gallery_content_likes" data-msgId="' + this.msgId + '">' +
                                    '<div></div>' + likes +
                                '<\/div>' +
                            '<\/div>';
            };
            this.toHTML_mini = function(cssNew) {
                cssNew = (cssNew) ? 'new ' : '';
                return '<div id="' + this.thumbId + '" class="'+ cssNew + this.typeOfContent +'"><\/div>';
            };
        }

        //Public
        function clear() {
            $galleryWrap_Content.empty();
            $galleryThumbs.empty();
        }

        function addNewBlock(msgId,userName,likes,type,content) {
            if ($addLinkInput.length === 0 ) {
                console.log('%cError >>> Where are you, Gallery input?!', 'color:red');
            }
            var result = {success: true, errorText: false}; //
            var block = new BlockInGallery(msgId, userName, likes, type,content);
            if ($('#'+block.thumbId).length > 0) {
                result.errorText = 'блок с таким айди уже существует ' + block.id;
            } else {
                if ($galleryThumbs.children().length === 12 ) {
                    if ($galleryThumbs.children().first().hasClass('empty_circle')) {
                        $galleryThumbs.children().first().remove();
                    } else if ($galleryWrap_Content.children().length === 12) {
                        $galleryThumbs.children().first().remove();
                        $galleryWrap_Content.children().first().remove();
                        $galleryWrap_MCSB.mCustomScrollbar('update');
                    } else {
                        result.success = false;
                        result.errorText = 'Не совпадает количество элементов в preview and thumb';
                    }
                }
                $galleryWrap_Content.append(block.toHTML_preview());
                $galleryThumbs.append(block.toHTML_mini(script_intStorage.galleryIsThisNewBlock(msgId)));
            }

            return result;
        }
        function addLikeToBlock(msgId,like) {
            $('#' + transformIdString('preview', msgId)).find('.gallery_content_likes').html('<div></div>' + like);
        }

        function setCapMainPlayer(pageOwner) {
            $('.player_block').html(getCapMainPlayerHtml(pageOwner));
        }
        return {
            clear: clear,
            addNewBlock: addNewBlock,
            getThumbPervId: transformIdString,
            addLikeToBlock:addLikeToBlock,
            setCapMainPlayer:setCapMainPlayer
        };
    })();

    var MainAdditionalContent = (function() {
        var $playerWrapper = $('.player_block');

        function test() {
            var result = {
                settings:'',
                error: false
            };
            if ($playerWrapper.data('param')) {
                result.settings = JSON.parse(Base64.decode($playerWrapper.data('param')));
            } else {
                result.error = 'Нет wrapper видео или не указан параметр видео';
            }
            return result;
        }

        function add(content) {
            $playerWrapper.html(content);
        }
        return {
            test: test,
            add: add
        };
    })();

    var LookStreamController = {
        init: function(config){
            this.config = config;
            var _tmp;

            this.PARAM = { //data параметры объекта видео, в которых передаются нужные мне параметры, заданные на строне БЕ
                start: false,
                length: false,
                provider: false
            };

            this.wrapper = $('#' + Config.HTML.streamWrapper);

            this.getParamFormHtml(Config.HTML.streamWrapper);

            this.checkHtmlPlayer(Config.HTML.playerElement); // проверить видео на странице

            this.messages = []; // массив сообщений в очереди ожидания
            this.msgNow = undefined;
            this.interval = undefined;
            this.playerPosition = {x: false, y: false}; // позиция плеера относительно страницы. Определяется позже через findPos()
            this.currentTime = this.PARAM.start; // в начале равно стартовому времени

            this.status = false; // false - not playing, true - playing

            // находим координаты плеера относительно страницы
            _tmp = findPos(this.wrapper[0]);
            this.playerPosition.x = _tmp[0];
            this.playerPosition.y = _tmp[1];

            function findPos(obj) {
                var curleft = 0,
                    curtop = 0;
                if (obj.offsetParent) {
                    do {
                        curleft += obj.offsetLeft;
                        curtop += obj.offsetTop;
                    } while (obj = obj.offsetParent);
                    return [curleft,curtop];
                }
            }
            this.playersParams = {
                twitch: {
                    synchDelayTime: 15000, // время задержки для лучшей синхронизации чата с видео
                    playerMinX: this.playerPosition.x,
                    playerMaxX: 729 + this.playerPosition.x,
                    playerMinY: this.playerPosition.y,
                    playerMaxY: 443 + this.playerPosition.y,
                    buttonsLineHeight: 29,
                    stretchLineWidth: 729,
                    stretchLineHeight: 31,
                    buttonPlayWidth: 28
                },
                youtube: {
                    synchDelayTime: 15000,
                    playerMinX: this.playerPosition.x,
                    playerMaxX: 742 + this.playerPosition.x,
                    playerMinY: this.playerPosition.y,
                    playerMaxY: 443 + this.playerPosition.y,
                    buttonsLineHeight: 28,
                    stretchLineWidth: 742,
                    stretchLineHeight: 13,
                    buttonPlayWidth: 56
                },
                cybergame: {
                    synchDelayTime: 10000,
                    playerMinX: this.playerPosition.x,
                    playerMaxX: 788 + this.playerPosition.x,
                    playerMinY: this.playerPosition.y,
                    playerMaxY: 443 + this.playerPosition.y,
                    buttonsLineHeight: 27,
                    stretchLineMinX: this.playerPosition.x + 80,
                    stretchLineMaxX: this.playerPosition.x + 80 + 540,
                    stretchLineWidth: 540,
                    stretchLineHeight: 10,
                    buttonPlayWidth: 30
                }
            };

            console.log('LookStreamMode INIT. Start time at: %o', new Date(this.PARAM.start));

            this.bind();
        },

        /**
         * Забирает параметры из data атрибутов тега object
         * // возможно стоит вынести этот пункт наружу из LookStream
         */
        getParamFormHtml: function(elemId) {
            elemId = elemId || console.log('ERROR: не указан айди элемента ролика.');
            var paramFromHtml;

            paramFromHtml = $('#' + elemId).data();
            for (var key in paramFromHtml) {
                if (this.PARAM[key] === undefined) {
                    console.log('ERROR: отсутствует параметр ' + key + ' в локальном объекте параметров видео  (this.PARAM)')
                } else {
                    this.PARAM[key] = paramFromHtml[key];
                }
            }

            for (var key2 in this.PARAM) {
                if (this.PARAM[key2] === false) {
                    console.log('ERROR: в локальный объект параметров видео this.PARAM не пришел параметр ' + key2);
                }
            }

            this.PARAM.provider = this.PARAM.provider ? this.PARAM.provider.substr(0, this.PARAM.provider.indexOf('.')) : false;
            if (this.PARAM.provider !== 'twitch' && this.PARAM.provider !=='youtube' && this.PARAM.provider !== 'cybergame') {
                console.log('%cERROR >>> данный плеер у нас не обрабатывается %o', 'color:red', this.PARAM.provider);
            }

            console.log(this.PARAM);

        },

        /**
         * Проверяет всё-ли правильно с оберткой плеера
         */
        checkHtmlPlayer: function(selector) {
            //console.log($(selector).children('param[name="wmode"]').length);
            var _videoObject = $(selector),
                $flashvars;
            if (_videoObject.children('param[name="wmode"]').length === 0) {
                _videoObject.append('<param name="wmode" value="opaque" />');
                console.log('INFO >>> к объекту видео добавлен параметр прозрачности');
            }
            if (_videoObject.children('embed').length > 0) {
                _videoObject.children('embed').attr('wmode', 'opaque');
            }
            $flashvars = _videoObject.children('param[name="flashvars"]');
            if ($flashvars.length !== 0) {
                if ($flashvars.attr('value').indexOf('auto_play')){
                    this.autoPlay = true; // i can use it in future
                }
            }

            // fixed player size
            switch (this.PARAM.provider) {
                case 'youtube':
                    _videoObject.attr('width','742').attr('height','443')
                        .children('embed').attr('width','742').attr('height','443');
                    this.wrapper.css({width:742,height:443}).attr('width','742').attr('height','443');
                    console.log('WARNING >>> change player size to normal size');
                    break;
                case 'twitch':
                    _videoObject.attr('width','729').attr('height','443');
                    console.log('WARNING >>> change player size to normal size');
                    break;
                case 'cybergame':
                    _videoObject.attr('width','788').attr('height','443')
                        .children('embed').attr('width','788').attr('height','443');
                    console.log('WARNING >>> change player size to normal size');
                    break;
                default:
                    break;
            }
        },

        bind: function() {
            var that = this;
            var playerParam = this.playersParams[this.PARAM.provider];

            //console.log('Position x %o, position y %o', this.playerPosition.x, this.playerPosition.y);
            var coordinates = {
                twitch: function(x,y) {
                    var result = {action:'',percent:'',error:''};
                    if (y <= playerParam.playerMaxY - playerParam.stretchLineHeight - playerParam.buttonsLineHeight){  // область видео, действие play|pause
                        result.action = 'playButton';
                    } else if (y <= playerParam.playerMaxY - playerParam.buttonsLineHeight) {  //  полоса промотки, действие play|pause
                        result.action = 'stretch';
                        result.percent = Math.round((x - playerParam.playerMinX)/(playerParam.stretchLineWidth*0.01))*0.01; // отношение всей длины к месту клика
                    } else if (x <= playerParam.playerMinX + playerParam.buttonPlayWidth && x > playerParam.playerMinX && y < playerParam.playerMaxY) { // полоса промотки
                        result.action = 'playButton';
                    } else {
                        result.error = 'Неизвестные координаты x: ' + x + ', y: ' + y;
                    }
                    return result;
                },
                youtube: function(x,y) {
                    var result = {action:'',percent:'',error:''};
                    if (y <= playerParam.playerMaxY - playerParam.stretchLineHeight - playerParam.buttonsLineHeight){  // область видео, действие play|pause
                        result.action = 'playButton';
                    } else if (y <= playerParam.playerMaxY - playerParam.buttonsLineHeight) {  //  полоса промотки, действие play|pause
                        result.action = 'stretch';
                        result.percent = Math.round((x - playerParam.playerMinX)/(playerParam.stretchLineWidth*0.01))*0.01; // отношение всей длины к месту клика
                        console.log('Release x %o minx %o stretchWidth %o percent %o', x, playerParam.playerMinX, playerParam.stretchLineWidth, result.percent);
                    } else if (x <= playerParam.playerMinX + playerParam.buttonPlayWidth) { // полоса промотки
                        result.action = 'playButton';
                    } else {
                        result.error = 'Неизвестные координаты x: ' + x + ', y: ' + y;
                    }
                    return result;
                },
                cybergame: function(x,y) {
                    var result = {action:'',percent:'',error:''};
                    if (y <= playerParam.playerMaxY - playerParam.stretchLineHeight - playerParam.buttonsLineHeight){  // область видео, действие play|pause
                        result.action = 'playButton';
                    } else if (x <= playerParam.playerMinX + playerParam.buttonPlayWidth) { // полоса промотки
                        result.action = 'playButton';
                    } else if (x >= playerParam.stretchLineMinX && x <= playerParam.stretchLineMaxX) { // полоса промотки
                        result.action = 'stretch';
                        result.percent = Math.round((x - playerParam.stretchLineMinX)/(playerParam.stretchLineWidth*0.01))*0.01; // отношение всей длины к месту клика
                    } else {
                        result.error = 'Неизвестные координаты x: ' + x + ', y: ' + y;
                    }
                    return result;
                }
            };
            //console.log('Coordinates %o', coordinates);
            this.wrapper.on('mousedown', function (e) {
                //console.log(e.clientX + '   ' + e.clientY);
                //console.log('INFO >>> playerParam %o', playerParam);
                var action = coordinates[that.PARAM.provider](e.clientX+document.documentElement.scrollLeft, e.clientY+document.documentElement.scrollTop),
                    timeChange;
                if (action.error) {
                    console.log('INFO >>> click %o playerCoordinates %o', action.error, playerParam);
                } else if (action.action === 'playButton') {
                    that.changeStatus();
                    console.log('PlayButton');
                    //console.log('LookStream: Button current time %o : %o ', Math.floor((that.currentTime - that.PARAM.start)/60),Math.floor(((that.currentTime - that.PARAM.start)/60-(that.currentTime - that.PARAM.start)%60)));
                } else if (action.action === 'stretch') {
                    timeChange = Math.round(that.PARAM.length * action.percent);
                    that.currentTime = that.PARAM.start + timeChange;
                    if (!that.status && that.PARAM.provider !== 'youtube' ) {
                        that.changeStatus();
                    }
                    console.log('StretchLine');
                    //console.log('LookStream: STRIP time %o : %o', Math.floor((that.currentTime - that.PARAM.start)/60),Math.floor(((that.currentTime - that.PARAM.start)/60-(that.currentTime - that.PARAM.start)%60)));
                }
            });
        },
        addToQueue: function(msg) {
            LookStreamModel.addMsgToLocalHistory(msg);
        },
        start: function() {
            var that = this;
            //console.log('DEBUG >>> LookStream START Playing startTime %o, currentTime %o', that.PARAM.start ,that.currentTime)
            setTimeout(function () { // задержка для более точной синхронизации с видео
                that.interval = setInterval(function () {
                    //console.log('DEBUG >>> LookStream PLAYING current time %o fromStart %o', that.currentTime, that.currentTime - that.PARAM.start);
                    //console.log('chat instance look %o', that.config.chat.interfaceHistory);
                    LookStreamModel.addMsgsForSecondToChat(that.currentTime,that.config.chat.interfaceHistory);
                    that.currentTime++;
                }, 1000);
            }, that.playersParams[that.PARAM.provider]);
        },
        stop: function() {
            console.log('DEBUG >>> LookStream STOP Playing currentTime %o', this.currentTime);
            clearInterval(this.interval);
        },
        changeStatus: function() {
            this.status = !this.status;

            if (this.status) {
                this.start();
            } else {
                this.stop();
            }
        }
    };

    var LookStreamModel = (function(depends){
        if (!depends) {
            console.log('ERROR >>> не объявлен зависимый модуль');
        }
        //Private
        var localHistory = {},
            msgAddedToChat = {},
            msgAddedToChatSort = [];
        var requestToBE = false,
            lastTimeWithMsgForVod; // после этого времени ролика истории нету
        var prevMsg,
            lastRequestedTime;

        function setRequestStatus(startStop) {
            //requestToBE = !!startStop;
            requestToBE = true;
            setTimeout(function () { // ограничение по частоте запросов
                requestToBE = false;
                //console.log('%cRequest set %o', 'color:red', requestToBE);
            }, 4000);
        }

        function setLastTimeWithMsg(timestamp) {
            lastTimeWithMsgForVod = (!lastTimeWithMsgForVod) ? timestamp : console.log('WARNING >>> последнее время уже было установлено lasttime %o timestamp %o', lastTimeWithMsgForVod, timestamp);
        }

        function getLastTimeWithMsg() {
            return lastTimeWithMsgForVod;
        }
        function timestampToSeconds(ts) {
            return Math.round(ts / 1000);
        }
        function isThisTimeInLocalHistory(timestampSec){
            return localHistory[timestampSec];
        }
        function hasChatThisMsg(msgId) {
            return msgAddedToChat[msgId];
        }

        function msgWasAddedToChat(msgId) {
            var len;

            msgAddedToChat[msgId] = true;
            msgAddedToChatSort.push(msgId);
            len = msgAddedToChatSort.length;
            if (msgAddedToChatSort[len-2] && msgAddedToChatSort[len-2] > msgAddedToChatSort[len-1]) {
                msgAddedToChatSort.sort(function (a, b) {
                    return a > b;
                });
            }
        }
        function whereToAddMsg(msgId) {
            var result,
                len = msgAddedToChatSort.length;
            if (len === 0 || msgAddedToChatSort[len-1] < msgId) {
                result = 'bottom';
            } else if(msgId < msgAddedToChatSort[0]){
                result = 'top';
            } else {
                for (var i=0; i < len; i++) {
                    if (msgId > msgAddedToChatSort[i]) {
                        result = msgAddedToChatSort[i];
                    } //айди, после которого вставить сообщение
                }
            }
            return result;
        }

        //Public
        /**
         * Получает время. По этому времени смотрит, есть-ли в локальном хранилище сообщения. Если есть, возращает сообщения, если нет - ничего.
         * @param timeSecond {timestamp} seconds
         * @returns msgsForSecond {array}
         */
        function addMsgsForSecondToChat(timeSecond, interfaceHistory) {
            var msgsForSecond,
                msgId,
                placeTo;
            //msgAddedToChat[msg.getMsgId()] = true;
            msgsForSecond = isThisTimeInLocalHistory(timeSecond);
            if (msgsForSecond) {
                if (msgsForSecond.length > 0) {
                    for (var i=0; i < msgsForSecond.length; i++) {
                        msgId = msgsForSecond[i].getMsgId();
                        placeTo = whereToAddMsg(msgId);
                        console.log('Place to Insert: %o currentTime %o', placeTo, timeSecond);
                        if (!hasChatThisMsg(msgId)) { // chat doesn't have this msg
                            if (typeof placeTo === 'number') {
                                //console.log('Add message %o between messages',msgId);
                                msgsForSecond[i].setPlaceToInsert(placeTo);
                                interfaceHistory.addMsg(msgsForSecond[i], false);
                            } else if (placeTo === 'bottom') {
                                //console.log('Add message %o to the bottom of the chat', msgId);
                                interfaceHistory.addMsg(msgsForSecond[i], false);
                            } else if (placeTo === 'top') {
                                //console.log('Add message %o to the top of the chat',msgId);
                                msgsForSecond[i].setPlaceToInsert('top');
                                interfaceHistory.addMsg(msgsForSecond[i], false);
                            } else {
                                console.log('ERROR >> ошибка определения места добавления сообщения в чта lookstream placeTo %o', placeTo);
                            }
                            msgWasAddedToChat(msgId);
                        } else {
                            //console.log('Scroll to this message %o',placeTo);
                            interfaceHistory.scrollToPlace(placeTo);
                        }
                    }
                }
            } else {
                if (!requestToBE) {
                    //console.log('%cRequest %o', 'color:red', requestToBE);
                    if (!getLastTimeWithMsg() || getLastTimeWithMsg() > timeSecond) {
                        setRequestStatus(true);
                        setLastReqTime(timeSecond);
                        //console.log('New H-request time %o LH %o', timeSecond, localHistory);
                        script_BE.sendToPHPCallback('history/time',{channel:ChatInstances.getChatChannels(ChatInstances.getChatNames()[0]),time:timeSecond},timeSecond, function(err,data){
                            if (err) {
                                console.log('ERROR >>> %o',err);
                            } else {
                                console.log('POST:history/time message id %o for that time %o',data[0], data[1]);
                                if (data[0] !== 'Null') {
                                    //определить ближайшие пять секунд как те, для которых точно была получена история
                                    addTimeToLocalHistory(data[1],data[1]+1,data[1]+2,data[1]+3,data[1]+4);

                                    script_BE.sendToPHP('history/after', {channel:ChatInstances.getChatChannels(ChatInstances.getChatNames()[0]),id:data[0]});
                                } else {
                                    setLastTimeWithMsg(data[1]);
                                }
                            }
                        });
                    }
                }
            }
            return msgsForSecond;
        }

        function setLastReqTime(timestamp) {
            lastRequestedTime = timestamp;
        }
        function getLastReqTime() {
            var result = lastRequestedTime;
            lastRequestedTime = false;
            return result;
        }

        /**
         * Добавляет сообщения в локальную историю с ключем в виде timestamp
         * @param msg
         */
        function addMsgToLocalHistory(msg) {
            //console.log('addMsgToLocalHistory msgId %o', msg.getMsgId());
            //console.log('HistoryMethod type %o allcount %o, thiscount %o', msg.historyMethod.type, msg.historyMethod.allCount, msg.historyMethod.thisCount);
            if (!msg.historyMethod || msg.historyMethod.type !== 'history-after') {
                return console.log('WARNING >>> в LookStream пока что обрабатывается только history-after история');
            }
            var timestamp = msg.getMsgTime()/1000;
            if ( msg.historyMethod /*&& msg.historyMethod.type == 'history-after'*/) {
                var emptyTime;
                if (prevMsg &&  msg.historyMethod.thisCount !== 0){
                    emptyTime = (msg.getMsgTime() - prevMsg.getMsgTime())/1000;
                    if (emptyTime > 1){
                        for (var i=1; i < emptyTime; i++) {
                            localHistory[prevMsg.getMsgTime()/1000+i] = [];
                        }
                    }
                }
                if (msg.historyMethod.thisCount === 0) {
                    var lastReqTime = getLastReqTime();
                    emptyTime = msg.getMsgTime()/1000 - lastReqTime;
                    if (emptyTime > 1){
                        for (var k=0; k < emptyTime; k++) {
                            localHistory[lastReqTime+k] = [];
                        }
                    }
                }
            }
            prevMsg = msg;
            msg.deleteHistoryMethod();
            if (localHistory[timestamp]) {
                localHistory[timestamp].push(msg);
            } else {
                localHistory[timestamp] = [msg];
            }
            /*if (msg.historyMethod.thisCount == msg.historyMethod.allCount) {
                setRequestStatus(false);
            }*/
        }

        /**
         * Добавляет в локальную историю время, для которого уже была получена история
         * @param timeArr - массив из timestamp
         */
        function addTimeToLocalHistory(timeArr) {
            for (var i=0; i<timeArr.length; i++) {
                if (!localHistory[timeArr[i]]){
                    localHistory[timeArr[i]] = [];
                }
            }
        }

        function getLocalHistory() {
            return localHistory;
        }
        return {
            addMsgsForSecondToChat: addMsgsForSecondToChat,
            addMsgToLocalHistory: addMsgToLocalHistory,
            addTimeToLocalHistory: '',
            getLocalHistory:getLocalHistory
        };
    })(LookStreamController);

    /**
     * Ищет неправильное исползование капса и мата. Если всё окей, возвращает false
     */
    var antiMatAndCaps = (function () {
        var matWordsArray = ['0YXRg9C5','0L/QuNC30LTQsA==','0LXQsdCw0YLRjA==','0LHQu9GP0LTRjA==','0LHQu9GP'], // list of mat words for regEx
            arrayOfPatternsBadWords = [], // сформированный массив слов, которые нельзя использовать на сайте (v1)
            regExPatternForBadWords = '', // сформированный reEx, по которому проверяются все слова (v2)
            simpleRegExPattern = ''; // самый простой вариант проверки на мат
        var replaceArr = {
            'а' : ['a', '@'],
            'б' : ['б', '6', 'b'],
            'в' : ['b', 'v'],
            'г' : ['r', 'g'],
            'д' : ['d', 'g'],
            'е' : ['e'],
            'ё' : ['е', 'e'],
            'ж' : ['*','zh'],
            'з' : ['3', 'z'],
            'и' : ['u', 'i'],
            'й' : ['u', 'y', 'i'],
            'к' : ['|{','i{'],
            'л' : ['l','ji'],
            'м' : ['m'],
            'н' : ['h', 'n'],
            'о' : ['o', '0'],
            'п' : ['n', 'p'],
            'р' : ['r', 'p'],
            'с' : ['c', 's'],
            'т' : ['m', 't'],
            'у' : ['y', 'u'],
            'ф' : ['f'],
            'х' : ['x', 'h', 'к', 'k','}{'],
            'ц' : ['c', 'u,'],
            'ч' : ['ch'],
            'ш' : ['sh'],
            'щ' : ['sch'],
            'ь' : ['b'],
            'ы' : ['bi'],
            'э' : ['е', 'e'],
            'ю' : ['io'],
            'я' : ['ya']
        };

        // decoding and else ...
        for (var i=0,len=matWordsArray.length; i<len; i++) {
            matWordsArray[i] = Base64.decode(matWordsArray[i]);
            arrayOfPatternsBadWords = arrayOfPatternsBadWords.concat(getMatRegEx(matWordsArray[i]));
        }
        regExPatternForBadWords = makeRegExPattern(matWordsArray,replaceArr);
        simpleRegExPattern = getSimpleRegExPattern(matWordsArray);
        // Private
        function getSimpleRegExPattern(badWordsArray) {
            var result = '(?:^|\n|\\s)(?:';

            for (var i= 0,len=badWordsArray.length; i<len; i++) {
                if (i > 0 ) {
                    result += '|(';
                } else {
                    result += '(';
                }
                //result += badWordsArray[i];
                for (var d= 0,len2=badWordsArray[i].length; d < len2; d++) {
                    if (d>0) {
                        result += '\\s*' + badWordsArray[i][d];
                    } else {
                        result += badWordsArray[i][d];
                    }
                }
                result += ')';
            }
            result += ')(?:\\s|,|\\.|$)*?';

            return new RegExp(result,'ig');
        }
        /**
         * Функция, собирающая паттерн для проверки слов
         * @param badWordsArray {object} массив запрещенных слов
         * @param letterReplaceArray {object} объект со всем возможными заменами букв
         */
        function makeRegExPattern(badWordsArray,letterReplaceArray) {
            var result = '';
            for (var i=0, len=badWordsArray.length; i<len; i++) { // массив плохих слов
                if (result) {
                    result += '|(';
                } else {
                    result += '(';
                }
                for (var k= 0,lenk=badWordsArray[i].length; k<lenk; k++) { // каждая буква плохого слова
                    result += '(?:' + badWordsArray[i][k];
                    for (var d= 0, lend=letterReplaceArray[badWordsArray[i][k]].length; d < lend; d++) { // каждая буква для замены
                        result += '|' + letterReplaceArray[badWordsArray[i][k]][d];
                    }
                    result += ')';
                }
                result += ')';
            }
            return result;
        }
        function getMatRegEx(word) {
            var result = [];
            var tmp = {};
            for (var i=0,len=word.length; i<len; i++) {
                if (!tmp[word[i]]) {
                    tmp[word[i]] = true;
                    result.push(word);
                    for (var k=0,len2=replaceArr[word[i]].length; k<len2; k++) {
                        result.push(word.replace(word[i],replaceArr[word[i]][k]));
                    }
                }
            }
            return result;
        }
        //Public
        return {
            /**
             *
             * @param msg {string} строка, которую надо проверить
             * @returns {array} массив запрещенных слов || null
             */
            checkMat: function (msg) {
                var result;
                function onlyUnique(value, index, self) {
                    return self.indexOf(value) === index;
                }
                if (!msg) {
                    result = console.log('ERROR >>> не задано сообщение для проверки');
                } else {
                    //Вырезаем обращение, чтобы оно не попадало в мат-фильтр
                    var personName = cutPersonality(msg).toPerson; //.toPerson
                    if (personName) {
                        msg = msg.substring(msg.indexOf(']', msg.indexOf(personName))+1);
                    }
                    switch ('3') {
                        case '1':
                            for (var i=0, len=arrayOfPatternsBadWords.length; i < len; i++) {
                                var trying = msg.indexOf(arrayOfPatternsBadWords[i]);
                                if (!result && trying !== -1) {
                                    result = 'Это мат! ' + arrayOfPatternsBadWords[i];
                                }
                            }
                            break;
                        case '2':
                            result = msg.match(regExPatternForBadWords);
                            break;
                        case '3':
                            //result = msg.match(simpleRegExPattern)?msg.match(simpleRegExPattern)[0]:false;
                            result = msg.match(simpleRegExPattern);
                            result = result ? result.filter( onlyUnique ) : false;
                            break;
                        default:
                            console.log('ERROR >>> не задан вариант мат-фильтра');
                            result = false;
                            break;
                    }

                }
                //console.log('result %r', result);
                return result;
            },
            checkCaps: function(msg,n) {
                var _result;
                if (!n) {
                    console.log('ERROR >>> antiCaps не задано кол-во прописных символов подряд для поиска');
                }
                //Вырезаем обращение, чтобы оно не попадало в мат-фильтр
                var personName = cutPersonality(msg).toPerson; //.toPerson
                //console.log('PErson: ' + personName);
                if (personName) {
                    msg = msg.substring(msg.indexOf(']', msg.indexOf(personName))+1);
                }

                var re3 = new RegExp([
                    "(",'\\s|[^a-zA-Zа-яА-Я0-9.\\+_\\/"\\>\\-]|^',")(?:","(", "[a-zA-Z0-9\\+_\\-]+","(?:", "\\.[a-zA-Z0-9\\+_\\-]+",")*@",")?(",
                    "http:\\/\\/|https:\\/\\/|ftp:\\/\\/",")?(","(?:(?:[a-zа-я0-9][a-zа-я0-9_%\\-_+]*\\.)+)",")(","(?:рф|ru|ua|com|ca|co|edu|gov|net|org|dev|biz|cat|int|pro|tel|mil|aero|asia|coop|info|jobs|mobi|museum|name|post|travel|local|[a-z]{2})",
                    ")(","(?::\\d{1,5})",")?(","(?:","[\\/|\\?]","(?:","[\\-a-zA-Z0-9_%#*&+=~!?,;:.\\/]*",")*",")","[\\-\\/a-zA-Z0-9_%#*&+=~]",
                    "|","\\/?",")?",")(",'[^a-zA-Z0-9\\+_\\/"\\<\\-]|$',")"
                ].join(""), "g");
                msg = msg.replace(re3, function (wholeLink,p1,p2,protocol,hostname,TLD,p6,path,p8,p9,p10,p11,p12,p13,p14,p15,offset,string) { // похоже неправильный порядок  url,protocol,userinfo,port,domain,path,page,fileExt,query,anchor
                    return ' ';
                });

                var _re = new RegExp('[A-ZА-Я]{'+ n +',}','g'),
                    _re2 = new RegExp('[A-ZА-Я]+','g');
                // поиск заданного количества прописных символов, идущих подряд
                if (msg.match(_re)) _result = 'Слишком много капса: ' + n;
                // больше половины символов в сообщении написано прописными буквами
                if (msg.match(_re2) && msg.length > 12 && msg.match(_re2).join('').length > msg.length/2) {
                    _result = 'Слишком много капса! ';
                }

                return _result;
            },
            getRandomNumber: function() {
                return privateRandomNumber;
            },
            getListOfWrongWords: function() {
                return matWordsArray;
            },
            getPatternOfBadWords: function(){
                return simpleRegExPattern;
            }
        };
    })();

    /**
     * Содержит данные о чатах со страницы
     */
    var ChatInstances = (function(chatClass){

        var chats = {}, // существующие instance чата
            chnBelongsToChat = {};

        var chHtmlOnPage = false;
        chHtmlOnPage = findHtml();
        for ( var i=0; i < chHtmlOnPage.length; i++) {
            if ( typeof chHtmlOnPage[i][1] === 'object') {
                chats[chHtmlOnPage[i][0]] = new NewInstance([chHtmlOnPage[i][0]],chHtmlOnPage[i][1],chHtmlOnPage[i][2],chHtmlOnPage[i][3], USER_OBJECT);
            } else {
                console.log('ERROR >>> неверный формат chHtmlOnPage[i][0] %s', chHtmlOnPage[i][0]);
            }
        }
        console.log('Info >>> instances %o', chats);

        /**
         * Поиск чата на странице при подключении скрипта
         */
        function findHtml() {
            var result = [];
            var $chatsHtml = $(chatClass);
            var $chat,
                chatCssId, // айди тега чата без #
                param, // data-param
                elements = { // элементы чата
                    history: '',
                    input: '',
                    send: '',
                    buttons: '',
                    adContent: ''
                };
            var tmp;

            // элементы, заданные в вёрстке
            var verstkaElements = {
                history: '.chat_wrapper',
                input: '.chat_input',
                buttons: '.chat_buttons',
                adContent: '.main_room_block'
            };

            if ($chatsHtml.length === 0) {
                console.log('ERROR >>> не указан класс для главного тега чата');
            }

            for (var i=0; i<$chatsHtml.length; i++) {
                elements = {};
                $chat = $chatsHtml.eq(i);
                //console.log('$chat %o', $chat);

                // check dataParam
                param = $chat.data('param');
                if (!param || param.length === 0) {
                    console.log('ERROR >>> не задан data-param on BE');
                }
                try {
                    param = JSON.parse(Base64.decode(param));

                    console.log('INFO >>> chatParam chat %o param %o', param.channel, param);
                    if (typeof param.channel !== 'object') {
                        console.log('%cERROR >>> неверный формат каналов в data-param %s', 'color:red', param.channel);
                        param.channel = [];
                    }
                } catch (e){
                    console.log('ERROR >>> парсинг параметров чата %o', e);
                }
                // check elements
                chatCssId = makeChatName(param.channel);
                if ($('#' + chatCssId).length === 0) {
                    $chat.attr('id', chatCssId);
                } else {
                    console.log('ERROR >>> элемент с таким айди уже существует');
                }
                tmp = $chat.find(verstkaElements.history);
                //console.log('CHAT %o VERSTKA %o', $chat, verstkaElements.history);
                if (tmp && tmp.length > 0) {
                    elements.history = tmp;
                }
                tmp = $chat.find(verstkaElements.input);
                if (tmp && tmp.length > 0) {
                    elements.input = tmp;
                    elements.send = elements.input.siblings('button');
                }
                tmp = $chat.find(verstkaElements.buttons);
                if (tmp && tmp.length > 0) {
                    elements.buttons = tmp;
                }
                //$('.ch_preparedContent').filter("[class='ch_preparedContent']").eq(0);
                tmp = $(verstkaElements.adContent).filter("[class='" + verstkaElements.adContent.substring(1) + "']").eq(0);
                if (tmp && tmp.length > 0) {
                    elements.adContent = tmp;
                    elements.adContent.addClass(chatCssId);
                }
                result.push([chatCssId,param.channel,param,elements]);
            }
            return result;
        }

        /**
         * Создание нового чата
         * * @param chat {string} chat's name
         * @param channels {array} список каналов, с которыми работает чат
         * @param chatParam {object}
         * @param chatElements {object} chatId, history, send, settings
         * @constructor
         */
        function NewInstance(chat, channels, chatParam, chatElements) {
            var that = this;

            this.$chat = $('#' + chat);
            this.chat = chat;
            this.channels = channels;
            this.param = chatParam;
            this.elements = chatElements;

            // Trello Doc
            that.param = {
                type : that.param.type || false,
                streamerName: that.param.streamerName || false,
                typeSettings: that.param.typeSettings || {},
                settings: that.param.settings || {},
                channel: that.param.channel || false,
                roomId: that.param.roomId || false,
                sharedContent: that.param.sharedContent || false,
                pageOwner: that.param.pageOwner || false
            };
            that.param.typeSettings = {
                deleteTime: that.param.typeSettings.deleteTime || false
            };
            that.param.settings = {
                enableShowImage: that.param.settings.enableShowImage || false,
                additionalContent: that.param.settings.additionalContent|| false

            };
            //check required params
            for (var key in chatParam) {
                if (chatParam.hasOwnProperty(key) && !that.param[key]) {
                    console.log('%cERROR >>> отсутствует необходимый параметр в data-param %o', 'color:red',key);
                }
            }

            /* interfaces */
            this.interfaceSendMsg = false;
            this.interfaceHistory = false;

            if (!chat  || !channels || !chatParam || !chatElements) {
                console.log('chatHtmlId || chatParam || chatElements %o, %o, %o',channels,chatParam,chatElements);
                console.log('ERROR >>> не задан параметр для чата');
            }

            for (var dd=0; dd < channels.length; dd++) {
                chnBelongsToChat[channels[dd]] = chat;
            }

            var _history = {};
            var _message = '';

            this.receiveNewMsg = function (recMsg, additional) {
                if (that.interfaceHistory) {
                    var _checkMsg;
                    _message = new ClassMessage(recMsg.id,recMsg.author_id,recMsg.author,recMsg.msg,recMsg.sound,recMsg.time,recMsg.channel,recMsg.likes_ac);
                    _checkMsg = checkMsg(_message, recMsg, additional, USER_OBJECT);
                    if (additional) _message.setHistoryMethod(additional.type,additional.direction,additional.allCount,additional.thisCount);
                    if (_checkMsg.error) {
                        //console.log('WARNING >>> %o',_checkMsg); //временно, чтобы не мусорить в консоль
                        console.log('сообщение уже есть в чате');
                    } else {
                        addMessage(_checkMsg.message, recMsg, that.interfaceHistory, additional);
                        // если не история, а обычное сообщение
                        /*if (!additional && that.param.settings.additionalContent && _checkMsg.parsedMsgLinks) {
                            addAdditionalContent(_checkMsg.parsedMsgLinks,_checkMsg.message);
                        }*/
                    }
                }
            };

            this.deleteMsg = function (id) {
                that.interfaceHistory.removeMsg({id:id});
            };

            this.clearChatAndLH = function () {
                _history = {};
                if (that.interfaceHistory) {
                    that.interfaceHistory.clearChat();
                }
            };

            /**
             *
             * @param message
             * @param recMessage
             * @param Interface
             * @param additional
             */
            function addMessage (message, recMessage, Interface, additional) {
                var _$sound = false;
                _history[recMessage.id] = message;

                if (Interface.addMsg) {
                    /*SOUND*/
                    if (message.options.sound && message.options.sound.length > 1) {
                        _$sound = $('#'+Config.HTML.sound+message.options.sound)[0];
                    }
                    //console.log('test');

                    /* РЕЖИМ СТРАНИЦЫ */
                    if (that.param.type === 'lookStream') {
                        //console.log(message.getMsgTime());
                        LookStreamController.addToQueue(message);
                    } else {
                        Interface.addMsg(message,_$sound);
                    }

                } else {
                    console.log('ERROR >>> ClassChat.addMessage не определен метод Interface.addMsg() %o', Interface);
                    console.log(ChatInstances.getInstances());
                }
            }

            /**
             * Проверяет сообщение перед добавлением в чат
             * @returns {object}
             */
            function checkMsg (message, recMessage, additional,_USER_OBJECT) {
                var result = {
                    error: false, // содержимое ошибки
                    message: false,
                    parsedMsgLinks: false
                };
                if (_history[recMessage.id]) {
                    result.error =  'Такое сообщение уже есть в чате';
                } // исключаем повторяющиеся сообщения при подкгрузке истории
                // ПРЕДУСЛОВИЯ

                /* ТЕКСТ СООБЩЕНИЯ */

                var parsedMsg = parseLinks(message,that.param.settings.enableShowImage);
                if (parsedMsg.newMsg) {
                    message.setMsgText(parsedMsg.newMsg);
                    message.setParsedLinks(parsedMsg.links);
                }

                // Заигноренные пользователи
                var ignoreUsersId = _USER_OBJECT.get().ignoreList; // list of ignored users
                //ignoreUsersId = ['3'];  //test
                if (ignoreUsersId && ignoreUsersId.length > 0) {
                    for (var i=0; i < ignoreUsersId.length; i++) {
                        if (message.getAuthorID() === ignoreUsersId[i]) {
                            if (_USER_OBJECT.get().user &&  _USER_OBJECT.get().user.userName !== message.getAuthor()) {
                                message.setMsgText('ignored');
                            }
                        }
                    }
                }
                // Мат-фильтр
                var matInText;
                // authorized or mat option enabled
                if (_USER_OBJECT.getSettingState('filter_chat_private_room')) {
                    matInText = antiMatAndCaps.checkMat(message.getMsgText());
                }
                if (matInText) {
                    for (var ii= 0, leni = matInText.length; ii < leni; ii++) {
                        message.setMsgText(message.getMsgText().replace(matInText[ii],' *** ', 'gi'));
                    }
                }

                /* Личные сообщения, от стримера, от создателя комнаты, системное, звук. */

                // если, ни то, ни другое - выкдючить звук
                if (_USER_OBJECT.get().user && _USER_OBJECT.get().user.userName){
                    if (_USER_OBJECT.get().user.userName === message.options.toPersonNamed){
                        message.setType('personal');
                    } else {
                        if (that.param.pageOwner && that.param.pageOwner === message.getAuthor() ) { // от Стримера
                            message.setType('fromSomePerson',{person:'streamer'});
                            // отключить звук стримера у самого стримера
                            if (that.param.pageOwner === _USER_OBJECT.get().user.userName) {
                                message.changeSound(false);
                            }

                        }
                    }
                }

                // Изменить стиль сообщения на "личное"
                if (_USER_OBJECT.get().user && _USER_OBJECT.get().user.userName === message.options.toPersonNamed) {
                    message.setType('personal');
                }

                result.message = message;
                return result;
            }

            /**
             * Ищет ссылки. Возвращает текст с замененными ссылками и все найденные ссылки
             */
            function parseLinks (_msg, imageEnabled) {
                var resultParsing = {
                    newMsg: false,
                    links: []
                };
                var _msgtext = _msg.getMsgText();
                var re2 = new RegExp([
                    "(",
                    '\\s|[^a-zA-Zа-яА-Я0-9.\\+_\\/"\\>\\-]|^',
                    ")(?:",
                    "(", "[a-zA-Z0-9\\+_\\-]+",
                    "(?:", "\\.[a-zA-Z0-9\\+_\\-]+",
                    ")*@",
                    ")?(",
                    "http:\\/\\/|https:\\/\\/|ftp:\\/\\/",
                    ")?(",
                    "(?:(?:[a-zа-я0-9][a-zа-я0-9_%\\-_+]*\\.)+)",
                    ")(",
                    "(?:рф|ru|ua|com|ca|co|edu|gov|net|org|dev|biz|cat|int|pro|tel|mil|aero|asia|coop|info|jobs|mobi|museum|name|post|travel|local|[a-z]{2})",
                    ")(",
                    "(?::\\d{1,5})",
                    ")?(",
                    "(?:",
                    "[\\/|\\?]",
                    "(?:",
                    "[\\-a-zA-Z0-9_%#*&+=~!?,;:.\\/]*",
                    ")*",
                    ")",
                    "[\\-\\/a-zA-Z0-9_%#*&+=~]",
                    "|",
                    "\\/?",
                    ")?",
                    ")(",
                    '[^a-zA-Z0-9\\+_\\/"\\<\\-]|$',
                    ")"
                ].join(""), "g");

                //resultParsing = _msg.match(re2, function(){ console.log('arguments %o', arguments) });

                if (_msgtext.match(re2)) {
                    var result;
                    resultParsing.newMsg = _msgtext.replace(re2, function (wholeLink,p1,p2,protocol,hostname,TLD,p6,path,p8,p9,p10,p11,p12,p13,p14,p15,offset,string) { // похоже неправильный порядок  url,protocol,userinfo,port,domain,path,page,fileExt,query,anchor
                        //console.log(' match %q %w %e protocol %r hostname %t TLD %y %u path %i %o %p %a %s %d %f %g %h %j %k ',match,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15,offset,string);
                        var imgExt = arguments[0].substr(arguments[0].length-5);
                        /*in chat*/
                        if (imageEnabled && imgExt.match(/\.jpg|\.jpeg|\.png|\.gif/i)) {
                            result = '<p><a title="' + arguments[0] + '" target="_blank" href="'+ wholeLink +'"><img style="display:inline-block;height:250px;" src="' + wholeLink + '" alt="Невозможно отобразить изображение"/></a></p>';
                        } else {
                            var link = /*arguments[3] + */arguments[4];
                            var http = arguments[3] ? '' : 'http://';
                            link = link.substring(0, link.length - 1);
                            result = ' <a title="' + arguments[0] + '" target="_blank" href="'+ http + arguments[0] +'">'+ link +'</a> ';
                        }

                        /*additional block*/
                        //resultParsing.links.push({wholeLink:wholeLink,p1:p1,p2:p2,protocol:protocol,hostname:hostname,TLD:TLD,p6:p6,path:path,p8:p8,p9:p9}); // all links
                        resultParsing.links[0] = (resultParsing.links[0]) ? resultParsing.links[0] : {author: _msg.getAuthor(), msgId:_msg.getMsgId(),wholeLink:wholeLink,p1:p1,p2:p2,protocol:protocol,hostname:hostname,TLD:TLD,p6:p6,path:path,p8:p8,p9:p9}; // only first link
                        return result;
                    });
                }
                return resultParsing;
            }
        }

        function makeChatName(chn) {
            return 'chat_' + chn.join('');
        }

        function getInstance(chatName) {
            return chats[chatName];
        }
        function getInstances() {
            return chats;
        }

        /**
         * Возвращает массив с именами чатомв
         * @returns {Array}
         */
        function getChatNames() {
            var result = [],
                tmp;
            tmp = getInstances();
            for (var key in tmp) {
                if (tmp.hasOwnProperty(key)) {
                    result.push(key);
                }
            }
            return result;
        }

        function getChatType(chatName){
            var result = false,
                tmp;
            if (chatName) {
                tmp = getInstances();
                result = (tmp[chatName]) ? tmp[chatName].param.type : false;
            } else {
                console.log('ERROR >>> неверно задано имя chatInstance');
            }
            return result;
        }

        function getChatChannels(chatName) {
            return getInstance(chatName).param.channel;
        }

        function getChatNameThatOwnsChn(channel) {
            return chnBelongsToChat[channel];
        }

        function getChatInstance(chatName) {
            return (chats.hasOwnProperty(chatName)) ? chats[chatName] : false;
        }

        function getChatsCount() {
            var result=0;
            for (var key in chats) {
                if (chats.hasOwnProperty(key)) {
                    result++;
                }
            }
            return result;
        }

        function getFirstChatInstance() {
            return ChatInstances.getChatInstance(ChatInstances.getChatNames()[0]);
        }

        return {
            NewInstance:        NewInstance,
            getInstances:       getInstances,
            getChatInstance:    getChatInstance,
            getFirstChatInstance: getFirstChatInstance,
            getChatNames:       getChatNames,
            getChatType:        getChatType,
            getChatChannels :   getChatChannels,
            makeChatName:       makeChatName,
            getChatNameThatOwnsChn: getChatNameThatOwnsChn,
            getChatsCount:      getChatsCount
        };



    })('.ch_chatData');

    /**
     *
     * @param config [U_O,chat,settings(optional)]
     * @constructor
     */
    function ClassInterfaceChatHistory(config) {
        var that = this;
        this.config = config;

        var auth = this.config.U_O.checkAuth();

        /*local variables*/
        this.notFirstScroll = false; // если хотя бы раз срабатывал скролл до конца страницы, можно включить подгрузку истории
        // for history before (up) method (or another history method)
        this.historyMsg = ''; // тут собираются в пачку сообщения истории
        // define if scroll must be stop
        this.lastScroll = undefined; // {number} last scroll position
        this.scrollStop = false; // {boolean} onScroll callback. if lastscroll < onScroll = stop
        this.allowLoadHistoryForScrollTop = (this.config && this.config.settings && this.config.settings.disableLoadHistoryForScrollTop) ? false : true;
        this.allowHighliteMsg = !!(config.settings && config.settings.allowHighlightMsg);

        // global functions
        this.changeSettings = changeSettings;
        this.updateSettings = updateSettings;
        this.bindAlways = bindAlways;
        this.showContextMenu = showContextMenu;
        this.clearChat = clearChat;
        this.showCountOfUsersOnChannel = showCountOfUsersOnChannel;
        this.showUsersOnChannel = showUsersOnChannel;
        this.bindAuth = bindAuth;

        if (auth) {
            this.bindAuth();
            this.updateSettings();
        }
        this.bindAlways();

        // jQuery custom scroll plugin. Init.
        var _$history = this.config.chat.elements.history;
        if (_$history.hasClass('.' + mCustomScrollbar)) {
            console.log('%cERROR >>> уже была произведена инициализцаия скролла плагина чата', 'color:red');
        }
        _$history.mCustomScrollbar({
            axis:"y",
            theme:"light",
            scrollTo: 'bottom',
            scrollInertia: 0,
            mouseWheel:{
                scrollAmount: 50,
                preventDefault: true
            },
            advanced: {
                updateOnContentResize:true,
                updateOnImageLoad: true
            },
            callbacks: {
                onInit: function() {
                    //console.log("scrollbars initialized");
                    _$history.mCustomScrollbar('scrollTo', 'bottom');
                },
                onOverflowY: function(){

                },
                onTotalScroll: function() {
                    //A function (or custom code) to call when scrolling is completed and content is scrolled all the way to the end (bottom/right)
                    //console.info('onTotalScroll. ' + this.mcs.top);
                    that.notFirstScroll = true;

                    setScrollStop(false);
                },
                onTotalScrollBack: function() {
                    //A function (or custom code) to call when scrolling is completed and content is scrolled back to the beginning (top/left)
                    //console.info('onTotalScrollBack. ');

                    // Подгрузка истории, если чат промотан доверху
                    var firstMsgId = _$history.find('.chat_message').filter(function(){return $(this).data('author') !== 'system';}).first().attr('id');

                    console.log('first id %i', firstMsgId);
                    if (that.allowLoadHistoryForScrollTop && firstMsgId !== 1 && that.notFirstScroll) {
                        script_BE.sendToPHP('history/before', {'channel': that.config.chat.param.channel, id: firstMsgId});
                    }
                },
                onScroll: function() {
                    //A function (or custom code) to call when scrolling is completed
                    //console.info('onScroll' + this.mcs.top);
                    if (this.mcs.top*(-1) < that.lastScroll*(-1) ) {
                        setScrollStop(true);
                    }
                    that.lastScroll = this.mcs.top;
                },
                onScrollStart: function() {
                    //console.info('onScrollStart');
                }
            }
        });
        var _$historyToAddMsg = _$history.find('.mCSB_container');

        function setScrollStop(trueFalse) {
            if (that.config && that.config.settings && that.config.settings.disableScrollStop) {
                that.scrollStop = false;
            } else {
                that.scrollStop = trueFalse;
            }
        }

        function getScrollStop() {
            return that.scrollStop;
        }

        function bindAuth() {
            /* ЧАТ. ОБРАБОТКА НАЖАТИЙ КЛАВИШ МЫШИ ДЛЯ АВТОРИЗОВАННЫХ */
            //console.log('getChatsCount %o', ChatInstances.getChatsCount());
            var $userNames = (ChatInstances.getChatsCount() === 1) ? $(document) : that.config.chat.$chat ;
            $userNames
                // при клике на имени пользователя левая кнопка мыши
                .on('click','.' + Config.HTML.addPersonTo, function (ev) {
                    //ev.stopPropagation() // отменяет предыдущие действия
                    var _$message = that.config.chat.elements.input;
                    var _personality = cutPersonality(_$message.val(), $(this).text()).msgBBname;
                    _$message.val(_personality);
                    that.config.chat.interfaceSendMsg.focusMsgInput();
                })
                // при клике на имени пользователя правая кнопка мыши
                .on('contextmenu', '.' + Config.HTML.addPersonTo,function (e) {
                    var $this = $(this);
                    if (!$this.hasClass('chat_pic2')) { //исключаем хедер чата
                        e.preventDefault();
                        script_BE.sendToPHP('chat/getContextMenu',{userId:$this.data('authorid'),messageId:$this.data('msgid')},e);
                    }
                });

            // Chat SETTINGS
            if (that.config.chat.elements.buttons){
                that.config.chat.elements.buttons.find(Config.HTML.chatSetting).on('click', function () {
                    that.changeSettings($(this).data('setting'),'');
                });
            }
            that.bindAuth = function(){
                console.log('WARNING >>> уже забиндино (history)');
            };
        }

        /**
         * Меняет настройку на противоположное значение. Только boolean
         * @param setting
         * @param value
         */
        function changeSettings (setting, value) {
            var _value;
            if (that.config.U_O.getSettingState(setting) !== undefined) {
                _value = !that.config.U_O.getSettingState(setting);
                script_BE.sendToPHP('chat/updateChatSettings',{setting:setting,value:_value});
                that.config.U_O.setSettingState(setting, _value);
            } else {
                console.log('Warning >>> Нет такого параметра в настройках чата');
            }
            that.updateSettings();
        }

        function updateSettings () {
            that.config.chat.$chat.find(Config.HTML.chatSetting).each(function(index) {
                var _setting = that.config.U_O.getSettingState($(this).data('setting'));
                if (_setting !== undefined && _setting === true) {
                    $(this).addClass('enabled').removeClass('disabled');
                } else if (_setting !== undefined && _setting === false) {
                    $(this).addClass('disabled').removeClass('enabled');
                } else {
                    var stringSettingsFromPHP = '';
                    for (var key in that.config.U_O.get()) {
                        stringSettingsFromPHP += key + ', ';
                    }
                    console.log('В USER_OBJECT (от сервера) не приходит настройка: ' + $(this).data('setting') + ' Список настроек с сервера: ' + stringSettingsFromPHP);
                }
            });
        }

        function showContextMenu (show,element,html) {
            var _$context;

            if (show) {
                var x=element.clientX,
                    y=element.clientY + $(window).scrollTop();

                var $oldContMenu = $('#'+ Config.HTML.contextMenu);
                if ($oldContMenu.length > 0 ) {
                    $oldContMenu.remove();
                }
                _$context = $(html).attr('id',Config.HTML.contextMenu).css({top:y,left:x,display:'block'});
                _$context.appendTo('body');
                _$context.on('click', function(){
                    that.config.chat.interfaceHistory.showContextMenu(false, false, false);
                    //console.log('Context Menu %o', that.config.chat);
                });
            } else {
                _$context = $('#'+Config.HTML.contextMenu);
                if (_$context.length > 0) {
                    _$context.remove();
                }
            }
        }

        function clearChat () {
            _$historyToAddMsg.empty();
        }

        function bindAlways() {
            var thumbId,
                preview;
            // убирает контекст меню
            $(document).on('click', 'body', function () {
                that.showContextMenu(false,false,false);
            });

            /* ЧАТ. ОБРАБОТКА НАЖАТИЙ КЛАВИШ МЫШИ ДЛЯ НЕАВТОРИЗОВАННЫХ */
            that.config.chat.$chat
                // показать пользователей на канале
                .on('click', Config.HTML.countUsersInChat, function () {
                    if ($('.who_is_in_chat').css('display') !== 'block') {
                        script_BE.sendToPHPCallback('chat/userList', {channel: that.config.chat.param.channel},that.config.chat.param.channel, function(err,responsArr){
                            var _users;
                            try {
                                _users = JSON.parse(responsArr[0]);
                                that.showUsersOnChannel(_users);
                            } catch (e) {
                                console.log('ERROR >>> POST:chat/userCount ошибка парсинга %o', e);
                            }
                        });
                    } else {
                        $(document).click();
                    }
                })
                .on('mouseenter', '.chat_message', function(){
                    if (GalleryOnPage) {
                        thumbId = GalleryOnPage.getThumbPervId('thumb', $(this).attr('id'));
                        $('#' + thumbId).addClass('hovered');
                        preview = GalleryOnPage.getThumbPervId('preview', $(this).attr('id'));
                        $('#' + preview).addClass('hovered');
                    }
                })
                .on('mouseleave', '.chat_message', function(){
                    $('#' + thumbId).removeClass('hovered');
                    $('#' + preview).removeClass('hovered');
                });

        }

        this.scrollToPlace = function (placeToInsert) {
            var _$history = that.config.chat.elements.history,
                $message;
            if (typeof placeToInsert === 'number') {
                _$history.mCustomScrollbar("update").mCustomScrollbar('scrollTo','#'+placeToInsert,{scrollInertia:0,timeout:0});
                $message = $('#' + placeToInsert);
                $message.addClass('t_hovered');
                setTimeout(function () {
                    $message.removeClass('t_hovered');
                }, 2000);
            } else {
                _$history.mCustomScrollbar("update").mCustomScrollbar('scrollTo',placeToInsert,{scrollInertia:0,timeout:0});
                $message = $('#' + placeToInsert);
                $message.addClass('t_hovered');
                setTimeout(function () {
                    $message.removeClass('t_hovered');
                }, 2000);
            }
        };

        this.addMsg = function (msg, _$sound) {
            //console.log('Interface Add Message msg %o, sound %o, up %o', msg.toHtml(), _$sound, up);
            var message = msg.toHtml();
            var stopHeight,
                currentHeight,
                placeToInsert;
            var $message; // dom message id

            /*SCROLLING and AddMSG*/
            var _$history = that.config.chat.elements.history,
                _$historyToAddMsg = _$history.find('.mCSB_container');

            //console.log('History wrap: %o, history container %o', _$history, _$historyToAddMsg);

            // если это история, то все сообщения собираются в одно и уже потом добавляются в чат
            if (msg.historyMethod) {
                this.historyMsg = msg.toHtml() + this.historyMsg;
                if (msg.historyMethod.allCount !== msg.historyMethod.thisCount) {
                    return;
                } else {
                    message = this.historyMsg;
                    this.historyMsg = '';
                }
            }

            placeToInsert = msg.getPlaceToInsert();
            // если нужно добавить сообщение в начале чата
            if (placeToInsert === 'top') {
                stopHeight = _$historyToAddMsg.height();
                setScrollStop(true);//перестать мотать чат
                _$historyToAddMsg.prepend(message);
                currentHeight = _$historyToAddMsg.height();
                _$history.mCustomScrollbar("update").mCustomScrollbar('scrollTo',currentHeight-stopHeight,{scrollInertia:0,timeout:0});
            } else if(placeToInsert === 'bottom') {
                _$historyToAddMsg.append(message);
                if (that.allowHighliteMsg) {
                    msg.highlight();
                }
                if (!getScrollStop()) {
                    _$history.mCustomScrollbar("update").mCustomScrollbar('scrollTo','bottom',{scrollInertia:0,timeout:0})
                }
            } else { //после какого-то сообщения
                $(message).insertAfter($('#' + placeToInsert));
                if (that.allowHighliteMsg) {
                    msg.highlight();
                }
                _$history.mCustomScrollbar("update").mCustomScrollbar('scrollTo','#'+placeToInsert,{scrollInertia:0,timeout:0});
                //console.log('scroll to %o', placeToInsert);
            }

            // S O U N D
            if (script_intStorage.isThisTabActive() && _$sound) {
                if( that.config.U_O.getSettingState('chat_personal_message_sound') && _$sound.getAttribute('id').indexOf('toMe') >= 0 ) {
                    _$sound.play();
                } else if (that.config.U_O.getSettingState('chat_streamer_message_sound') && _$sound.getAttribute('id').indexOf('streamer') >= 0 ) {
                    _$sound.play();
                }
            }

            // промотать чат по загрузке изображения
            if (message.indexOf('<img')) {
                //console.log($(message));
                $(message).find('img').each(function (index, el) {
                    $(this).load(function(){
                        if (!getScrollStop()){
                            _$history.mCustomScrollbar("update").mCustomScrollbar('scrollTo','bottom',{scrollInertia:0,timeout:0});
                        }
                    });
                });
            }

            // ADDITIONAL CONTENT
            var parsedMsgLinks = msg.getParsedLinks();
            if (that.config.chat.param.settings.additionalContent && msg.historyMethod.direction !== 'top' && parsedMsgLinks) {
                var type = undefined,
                    dataForAdditionalBlock,
                    l,
                    $chGallery = $('.chat_gallery');
                dataForAdditionalBlock = undefined;
                var adtlC = false;
                for (var d=0; d < parsedMsgLinks.length; d++) {
                    adtlC = script_AdditionalContent.check(
                        parsedMsgLinks[d],
                        that.config.chat.elements.adContent,
                        {
                            samplesInsteadVideo:msg.getAuthor(),
                            autoPlayVideo: USER_OBJECT.getSettingState('shared_content_autostart')
                        }
                    );
                    if (adtlC.html) {
                        if (msg.getAuthor()) {
                            GalleryOnPage.addNewBlock(msg.getMsgId(),msg.getAuthor(),msg.getLikes(),adtlC.contentClass,adtlC.html);
                        } else {
                            if (msg.getMsgText().indexOf('mainPlayer_sample_min.png') >= 0) {
                                GalleryOnPage.setCapMainPlayer(USER_OBJECT.checkAuth() && that.config.chat.param.pageOwner === USER_OBJECT.get().user.userName);
                            } else {
                                MainAdditionalContent.add(adtlC.html);
                            }
                        }
                    }
                }
            }
        };

        this.removeMsg = function(obj) {
            obj = obj || {};
            var $idElement;
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    switch (key) {
                        case 'id':
                            $idElement = $('#' + obj[key]);
                            var hg = $idElement.height();
                            if ($idElement.hasClass(Config.HTML.message)) {
                                var text = 'сообщение было удалено';
                                if (that.config.settings && that.config.settings.msgAutoDelTime) {
                                    text += ' прошло ' + that.config.settings.msgAutoDelTime/1000 + ' секунд';
                                }
                                $idElement.css({'height':hg + 'px'}).children('span').eq(1).html(text);
                            } else {
                                console.log('InterfaceChatHistory.removeMsg нет такого айди сообщения');
                            }
                            break;
                        case 'first':
                            //удаляет всё сообщения, индекс которых меньоше obj[key] от начала чата
                            $('div.' + Config.HTML.message+ ':lt(' + obj[key] + ')').remove();
                            break;
                        case 'last':
                            var el = $('div.' + Config.HTML.message).length - obj[key]-1;
                            $('div.' + Config.HTML.message+ ':gt(' + el + ')').remove();
                            break;
                        default:
                            console.log('InterfaceChatHistory неправильный ключ параметра функции removeMsg: ' + key);
                    }
                }
            }
        };

        this.addAdditionalContent = function (type, data) {
            var $blockForAdditionalContent = that.config.chat.$chat.find('.ch_preparedContent'),
                html;
            if ($blockForAdditionalContent.length > 0 ) {
                switch (type) {
                    case 'image':
                        html = '<p><a title="' + data.src + '" target="_blank" href="'+ data.src +'"><img style="display:inline-block;height:250px;" src="' + data.src + '" alt="Невозможно отобразить изображение"/></a></p>';
                        break;
                    case 'players':
                        switch (data.player) {
                            case 'twitch':
                                // validate data
                                if (data.channel && data.channel.indexOf('/') === -1) {
                                    html = '<iframe src="http://www.twitch.tv/';
                                    html += data.channel;
                                    html += '/embed" frameborder="0" scrolling="no" height="378" width="620"></iframe><a href="http://www.twitch.tv/';
                                    html += data.channel;
                                    html += '?tt_medium=live_embed&tt_content=text_link" style="padding:2px 0px 4px; display:block; width:345px; font-weight:normal; font-size:10px;text-decoration:underline;">Watch live video from omgezniki on www.twitch.tv</a>';
                                } else {
                                    html = false;
                                }
                                break;
                            default:
                                break;
                        }
                        break;
                    default:
                        break;
                }
                if(html) {
                    $blockForAdditionalContent.html(html);
                } else {
                    console.log('ERROR >>> ');
                }
            } else {
                console.log('ERROR >>> block for additional content doesn\'t exist');
            }

        };

        function showCountOfUsersOnChannel (count) {
            if (typeof count !== 'undefined') {
                //тупой костыль
                var $countUsersBlock = $(Config.HTML.countUsersInChat);
                if ($countUsersBlock.length > 1) {
                    that.config.chat.$chat.find(Config.HTML.countUsersInChat).html(count.authorized);
                } else {
                    $countUsersBlock.html(count.authorized);
                }
                //console.log('$countUsersBlock %o users: %o', $countUsersBlock, count.authorized)
            }
        }

        function showUsersOnChannel(users) {
            //todo теперь только один вариант
            // в зависимости от типа страницы
            var $chatPageWrap = that.config.chat.$chat.find('.user_in_chat_wrapper');
            var _htmlString = '';
            var $userListScrollContent;

            if (!$chatPageWrap.hasClass('mCustomScrollbar')) {
                $chatPageWrap.mCustomScrollbar({
                    axis: "y",
                    theme: "light",
                    scrollInertia: 100,
                    advanced:{autoExpandHorizontalScroll:true},
                    mouseWheel: {
                        scrollAmount: 350,
                        preventDefault: true
                    }
                });
            }
            $userListScrollContent = $chatPageWrap.find('.user_in_chat_list');

            for (var i=0; i < users.length; i++) {
                _htmlString += '<div style="height: 20px;" class="user_in_chat_row ' + Config.HTML.addPersonTo + '">'+ users[i] +'</div>';
            }
            $userListScrollContent.html(_htmlString);

            /*var $roomPage = $('.room_block_userlist');


            var ownerClass = '',// for room page
                owner = '',
                $roomOwner = $('#ch_roomOwner');
            if ($roomOwner.length > 0) {
                owner = $roomOwner.data('owner');
            }// end for room page

            if ($chatPageWrap.length > 0) {
                for (var i=0; i < users.length; i++) {
                    _htmlString += '<div style="height: 20px;" class="user_in_chat_row ' + Config.HTML.addPersonTo + '">'+ users[i] +'</div>';
                }
                $userListSrollContent.html(_htmlString);
            } else if ($roomPage.length > 0) {
                for (var i2=0; i2 < users.length; i2++) {
                    if (users[i2] === owner) {
                        ownerClass = ' leader';
                        _htmlString = '<div style="height: 20px;" class="username ' + Config.HTML.addPersonTo + ownerClass +'">'+ users[i2] +'</div>' + _htmlString;
                    } else {
                        _htmlString += '<div style="height: 20px;" class="username ' + Config.HTML.addPersonTo + '">'+ users[i2] +'</div>';
                    }
                }
                $roomPage.html(_htmlString);
            }
*/
            // TEST
            /*_htmlString = '';
             for (var i=1; i <= 30; i++ ) {
             _htmlString += '<div style="height: 20px;" class="user_in_chat_row">t0s '+ i +' </div>';
             }*/
            // END TEST

            //script_Chat_list_users(); // {dolgovec} script.js. перерисовка блока с пользователями чата
        }
    }

    /**
     *
     * @param {object} msg
     * @param {element} _$sound
     * @param {boolean} up
     */
    function ClassInterfaceSendMessage(config) {
        var that = this;

        this.config = config;
        //console.log('this.config %o', this.config);

        this.$htmlSendAndMsg = this.config.chat.elements.input;
        this.$htmlSendAndMsg.add(this.config.chat.elements.send);
        this.$sendButton = this.config.chat.elements.send;
        this.message = this.config.chat.elements.input;//$('#' + Config.HTML.msgToSend);
        this.enabled = false; // определяет, включена возможность отправлять сообщения или нет
        this.checkRetryMsg = antiRetryMsg(2);

        this.enable = enable;
        this.bind = bind;

        if (this.config.auth) {
            this.enable(true);
            this.bind();
        } else {
            this.$htmlSendAndMsg.attr('disabled','disabled').attr('placeholder','Нужно авторизоваться');
        }

        function bind() {
            //var that.message = $('#'+Config.HTML.msgToSend);
            var checkCaps, checkMat;
            var msgSendDelayReady = readyToSend();
            // при клике на "send message"
            that.$sendButton.on('click', function(e) {
                e.preventDefault();
                // ПРОВЕРКИ СООБЩЕНИЯ
                if (Config.Interface.antiSpamDelay && !msgSendDelayReady(Config.Interface.antiSpamDelay)) {
                    return that.showNotification('Вы пытаетесь отправлять сообщения слишком быстро.'); //проверка перед отправкой
                }

                checkCaps = antiMatAndCaps.checkCaps(that.message.val(),Config.Interface.antiCaps);
                if (Config.Interface.antiCaps && checkCaps) {
                    return that.showNotification(checkCaps);
                }

                if (Config.Interface.maxSymbols && that.message.val().length > Config.Interface.maxSymbols) {
                    return that.showNotification('Разрешенная длина сообщения: ' + Config.Interface.maxSymbols + '. Превышение на ' + that.message.val().length);
                }

                if (that.checkRetryMsg(that.message.val()).result ) {
                    return that.showNotification('Слишком много повторений одного и того же сообщения');
                }

                if (that.message.val() !== '') {
                    that.sendMessage(that.config.chat.param.channel,that.message.val());
                    that.message.val('');
                } else {
                    console.log('Chat >>> не задан текст сообщения');
                }
            });

            streamerPopup();
            // кнопки чата
            //chatPic();

            // нажатие клавиш
            document.onkeydown = function (e) {
                e = e || window.event;
                if (e.keyCode === 13 && $(document.activeElement).attr('id') === that.message.attr('id')) {
                    e.preventDefault();
                    that.$sendButton.click();
                }
            };

            // Chat SMILES
            // прогрузка смайлов
            //$(Config.HTML.chatjs_smiles).on('click', function () {
            that.config.chat.elements.buttons.find('.smiles').on('click', function () {
                script_Smiles.loadSmilesFromBE('','mediazone');
            });
            // добавление смайлов и подгрузка другой страницы смайлов
            if (that.config.chat.elements.buttons) {
                that.config.chat.elements.buttons.find('.smaili')
                    .on('click', '.chat_smiles',function () {
                        script_Smiles.addSmileToInput($(this),that.config.chat.elements.input);
                    })
                    .on('click','li > a', function(e) {
                        e.preventDefault();
                        script_Smiles.loadSmilesFromBE($(this).attr('href'),'mediazone');
                    });
            }
            that.bind = function() {
                console.log('WARNING >>> уже забиндино (send)');
            };
        }

        function chatPic() {
            //changing activeClass at icons and show popups
            var $chatIcons = $('.chat_pic'),
                $closeButton = $('.close_open_popup'),
                chatPopup = '.click_user_popup',
                thisPopup;
            var chatPicAssociations = {
                'add_link': '.add_link_popup',
                'options' : '.option_popup',
                'smiles':'.smaili',
                'poll' : '.golosovalka',
                'poll2':'.vote_poll',
                'poll3':'.poll_results',
                'text': 'popup_actions_list'
            };
            $chatIcons.click(function() {
                console.log('chat pic click %o', $(this).attr('class'));
                $(chatPopup).hide();
                if ($(this).hasClass('active')) {
                    $chatIcons.removeClass('active');
                } else {
                    $chatIcons.removeClass('active');
                    thisPopup = $(this).attr('class');
                    thisPopup = thisPopup.replace(' chat_pic','');
                    thisPopup = thisPopup.replace('chat_pic ','');
                    $(this).addClass('active');
                    $(chatPopup+chatPicAssociations[thisPopup]).show();
                }
            });
            $closeButton.click(function(){
                $(chatPopup).hide();
                $chatIcons.removeClass('active');
            });
        }
        function streamerPopup() {
            $('.chat_header').on('contextmenu', '.chat_pic2', function (e) {
                e.preventDefault();
                $('.popup_actions_list').show();
            });
        }

        /**
         * Проверка на повторяющиеся сообщения
         * @returns {Function} если сообщение повторяется больше заданного количества раз, то возвращается ob.result=true
         */
        function antiRetryMsg(maxRetry) {
            var ob = {count:0,msg:'',result:false};
            return function(msg) {
                ob.result = false;
                if (ob.msg === msg) {
                    ob.count++;
                } else {
                    ob.count = 0;
                }
                ob.msg = msg;
                if (ob.count >= maxRetry) {
                    ob.result = true;
                }
                return ob;
            };
        }
        /**
         *
         * @returns {Function}
         */
        function readyToSend() {
            var interval = false;
            return function(delay) {
                if (interval) {
                    return false;
                } else {
                    interval = setTimeout(function(){
                        interval = false;
                    }, delay);
                    return true;
                }
            };
        }

        function enable (enabled) {
            if (enabled) {
                that.$htmlSendAndMsg.removeAttr('disabled').attr('placeholder','Напиши сюда скорее');
                that.message.css('display', 'block');
                that.enabled = true;
            } else {
                that.$htmlSendAndMsg.attr('disabled','disabled').attr('placeholder','Невозможно отправить сообщение');
                that.enabled = false;
            }
        }

        this.sendMessage = function(channel,message){
            var _this = this;
            //todo времененное решение для BE и privateRoom. Посылать save = false, если задано время удаления сообщений
            var save = !(that.config.chat.interfaceHistory.config.settings && that.config.chat.interfaceHistory.config.settings.msgAutoDelTime);

            //var timeNOW = 1421829900000; message = (that.config.chat.param.type === 'lookStream') ? Math.round((new Date().getTime() - timeNOW)/1000) + ' sec >> ' + message : message;

            script_BE.sendToPHP('chat/sendMessage',{channel:channel,message:message,save:save});
        };

        this.showNotification = function(txt) {
            script_error_popup(txt);
        };

        this.focusMsgInput = function() {
            that.message[0].focus();
        };
    }

    /**
     *
     * @param {number} id
     * @param {string} author_id
     * @param {string} author
     * @param {string} msg
     * @param {boolean} sound
     * @param {number} time
     * @param {string} channel
     * @param {number} likes_ac
     * @constructor
     */
    function ClassMessage(id,author_id,author,msg,sound,time,channel,likes_ac) {
        //console.log('likes: %o', likes_ac);
        if (!id || !msg || !time || !channel) {
            console.log('ERROR >>> ClassMessage. Не задан один из параметров сообщения id %o msg %o time %o channel %o', id, author_id, author, msg, time, channel);
        }
        //console.log('MESSAGE %o', {id: id, msg:msg, time: time});
        var _id = id,
            _author = author,
            _author_id = author_id,
            _msg = msg,
            _sound = sound,
            _time = time*1000; // переводим в секунды для POSIX, в котором приходят даты
        var _this = this;

        var _personality,
            parsedLinks = false;
        var msgTextStyle = '', //стили
            msgAuthorStyle = '';

        var placeToInsert; // место в чате, куда добавить

        this.options = {
            sound: false, //название проигрываемого файла
            toPersonNamed: '',
            toPersonNamedHtml: '',
            toMe: false, // {boolean} если обращение лично этому пользователю
            system: false // {boolean} если сообщение от сервера (author === 0)
        };

        this.getMsgId = function () {
            return _id*1;
        };
        this.getMsgDay = function () {
            //return new Date(_time).getDay();
            return _time;
        };
        this.getAuthorID = function () {
            return author_id;
        };
        this.getAuthor = function () {
            return author;
        };
        this.getPlaceToInsert = function () {
            return (placeToInsert) ? placeToInsert : 'bottom';
        };
        this.getLikes = function () {
            return (likes_ac) ? likes_ac: 0;
        };
        function setTextStyle (style) {
            msgTextStyle = ' '+style;
        }
        function setAuthorStyle (style) {
            msgAuthorStyle = ' '+style;
        }
        function setUserToStyle(style) {
            if (_this.options.toPersonNamedHtml) {
                _this.options.toPersonNamedHtml = _this.options.toPersonNamedHtml.replace('class="','class="'+style+' ');
            } else {
                console.log('%cERROR >>> не задан this.options.toPersonNamedHtml  %o', 'color:red', _this.options.toPersonNamedHtml);
            }
        }

        this.setPlaceToInsert = function(place) {
            placeToInsert = place;
        };
        /**
         * Установить тип сообщения - влияет на стили
         */
        this.setType = function (type,param) {
            switch (type) {
                case 'common':
                    msgTextStyle = msgAuthorStyle = '';
                    break;
                case 'fromSomePerson':
                    if (param.person === 'system') {
                        setAuthorStyle('system');
                        setTextStyle('');
                    } else if (param.person === 'streamer') {
                        setAuthorStyle('');
                        setTextStyle('streamer');
                        this.changeSound('streamer');
                    } else {
                        console.log('ERROR >>> не задана или неправильно задана персона');
                    }
                    break;
                case 'personal':
                    setAuthorStyle('');
                    setUserToStyle('toPerson');
                    setTextStyle('toMe');
                    this.changeSound('toMe');
                    break;
                default:
                    console.log('ERROR >>> неизвестный тип сообщения для установки');
                    break;
            }
        };
        this.setParsedLinks = function (pL) {
            parsedLinks = pL;
        };

        //START Анализ сообщений
        if (_sound || _sound === undefined) {
            this.options.sound = true;
        }
        if (_author === 0) {
            this.options.system = true;
            _author = 'system';
        }

        _personality = cutPersonality(_msg);
        if (_personality) {
            _msg = _personality.msg;
            _this.options.toPersonNamed = _personality.toPerson;
            _this.options.toPersonNamedHtml = _personality.toPersonHtml;
        }
        //END Анализ сообщений

        /**
         * Если в тексте есть обращение, обновляет переменную options.toPersonNamed и удаляет обращение из сообщения
         */
        function findPersonality () {
            var re = /^(\s*\[b](\w*)\[\/b],?\s*)/; // '[b]userName[/b], '
            if (_msg.match(re)) {
                _msg = _msg.replace(re, function(match,p1,p2) {
                    _this.options.toPersonNamed = p2;
                    return '';
                });
            }

        }

        this.historyMethod = false;
        /**
         * Устанавливает дополнительные свойства сообщения
         * @param type
         * @param direction
         * @param allCount
         * @param thisCount
         */
        this.setHistoryMethod = function(type,direction,allCount,thisCount) {
            this.historyMethod = {};
            this.historyMethod.type = type;
            this.historyMethod.direction = direction;
            this.historyMethod.allCount = allCount;
            this.historyMethod.thisCount = thisCount;

            if (this.historyMethod.direction === 'top') {
                this.setPlaceToInsert('top');
            } else if(this.historyMethod.direction) {
                console.log('ERROR >>> неправильно задано historyMethod["direction"] %o', this.historyMethod);
            }
        };
        this.deleteHistoryMethod = function () {
            this.historyMethod = false;
        };

        /**
         * Добавляет название проигрываемого звука
         * @param sound
         */
        this.changeSound = function(sound) {
            if (this.options.sound) {
                this.options.sound = sound;
            }
        };
        /*this.replaceMessage = function(message) {
         _msg = message;
         };*/
        this.getMsgText = function () {
            return _msg;
        };
        this.getMsgTime = function () {
            return _time;
        };
        this.setMsgText = function (text) {
            _msg = text;
        };
        this.getParsedLinks = function() {
            return parsedLinks;
        };

        this.highlight = function () {
            var $msg = $('#' + _this.getMsgId());
            if ($msg.length > 0) {
                $msg.addClass('t_hovered');
                setTimeout(function () {
                    $msg.removeClass('t_hovered');
                }, 1000);
            }
        };

        this.toHtml = function() {
            var stroka;

            if (this.options.system) {
                msgAuthorStyle = ' system';
            }

            stroka = '' +
                '<div class="chat_message" id="'+ _id +'" data-author="'+ _author +'" data-time="'+ _time +'" data-sound="'+ this.options.sound +'">' +
                '<span class="user_name ' + Config.HTML.addPersonTo + msgAuthorStyle + '" data-authorid="' + _author_id + '" data-msgid="' + _id + '" title="' + new Date(_time).toLocaleString() + '" >'+ _author +':</span>' +
                (this.options.toPersonNamedHtml || '&nbsp;') +
                '<span class="user_chat_message ' + msgTextStyle + '">' +
                _msg +
                '</span>' +
                '</div>';

            return stroka;

        };
    }

    /**
     * Дублирующая функция поиска "обращения".
     * @param {string} msg сообщение, в которое нужно добавить обращение
     * @param {string} name если указано имя, то это имя добавляется в сообщение в качестве обращения return msgBBname
     * @returns {object} новое сообщение с обращением и имя
     */
    function cutPersonality(msg,name) {
        if (msg === false || msg === undefined) {
            console.log('function cutPersonality неправильные параметры');
        }
        var nameHtml,msgBBname;

        var re = /^(\s*\[b](.*):\[\/b],?\s*)/; // '[b]userName[/b], '
        if (name) {  // в сообщение добавляется обращение вида "[b]UserName[/b],"
            if (msg.match(re)) { //check field
                msgBBname = msg.replace(re,function(match,p1,p2) { // p2 - username
                    if (name[name.length-1] !== ':') {
                        name += ':';
                    } //добавляем : после ника, если надо
                    return '[b]' + name + '[/b], ';
                });
            } else {
                if (name[name.length-1] !== ':') {
                    name += ':';
                } //добавляем : после ника, если надо
                msgBBname = '[b]' + name + '[/b], ' + msg;
            }
        } else { // из сообщения вырезается обращение
            if (msg.match(re)) {
                msg = msg.replace(re, function(match,p1,p2) {
                    name = p2;
                    nameHtml = '<span class="user_name_to">'+p2+', </span> ';
                    return '';
                });
            }
        }
        return { msg:msg, toPerson: name, toPersonHtml: nameHtml, msgBBname: msgBBname };
    }

    var somePostMethods = (function(){
        var started = false;

        function start() {
            started = true;
            var chats = ChatInstances.getChatNames(),
                chat,
                _channel;
            for (var i=0; i < chats.length; i++) {
                chat = ChatInstances.getChatInstance(chats[i]);
                _channel = chat.param.channel;

                /*if(chat.param.type && chat.param.type === 'privateRoom') {
                    //sendUserList(_channel, 61000);
                }*/
                sendKeepAlive(_channel,29000);
                sendUserCount(_channel,59000);
            }
        }

        function sendKeepAlive(channel, time) {
            script_BE.sendToPHP('chat/keepalive', {channel: channel});
            setInterval(function() {
                script_BE.sendToPHP('chat/keepalive', {channel: channel});
            }, time);
        }
        function sendUserCount(channel, time) {
            script_BE.sendToPHP('chat/userCount', {channel:channel}, channel);
            setInterval(function() {
                script_BE.sendToPHP('chat/userCount', {channel:channel}, channel);
            }, time);
        }
        function sendUserList(channel, time) {
            script_BE.sendToPHP('chat/userList', {channel: channel},channel);
            setInterval(function() {
                script_BE.sendToPHP('chat/userList', {channel: channel},channel);
            }, time);
        }
        return {
            start: start,
            isStarted: function() {
                return started;
            }
        };
    })();

    /**
     * Основная логика работы соединений
     */
    var BindSubscriptions = (function() {

        var chats = ChatInstances.getChatNames(); // массив имен чатов
        var onlineStatus;

        var token; // токены подписок

        script_BE.sendToPHP('chat/uo'); // обновление U_O, если вызов чата выполняется позже

        /**
         * UserObject
         * Получение userObject (след. прошла авторизация и можно запускаться)
         */
        token = script_PubSub.subscribe('NODEJS:UserObject', function (subscription, receivedData) {
            //console.log('INFO >>> Authorized');
            //console.log('INFO >>> UserObject получен: subsr: %d response %r', subscription,receivedData);

            if (!onlineStatus || !USER_OBJECT.checkAuth() && receivedData.user && receivedData.user.userName) { /* первый userobject || reconnect || из неавторизованного в авторизованного */
                console.log('%cnew U_O >>> New connect || Reconnect || Authorization: data %o', 'color:green', receivedData);

                USER_OBJECT.update(receivedData);

                for (var i=0; i < chats.length; i++) {
                    //console.log('ChatInstances.getChatChannels(chats[i]) %o', ChatInstances.getChatChannels(chats[i]));
                    script_BE.sendToPHP('chat/subscribe',{channel:ChatInstances.getChatChannels(chats[i])});
                    onlineStatus = true;
                }
            } else if (USER_OBJECT.get()) { // если только поменялись какие-то значения
                console.log('%cnew U_O >>> Update: data %o', 'color:green', receivedData);

                USER_OBJECT.update(receivedData);
                for (var i2=0; i2 < chats.length; i2++) {
                    if (chats[i2].interfaceHistory) {
                        chats[i2].interfaceHistory.updateSettings();
                    }
                }
            }
        });
        tokenToUnsub.push(token);

        /**
         * SUBSCRIBE
         * подписка на канал
         * В данном блоке, в зависимости от режима страницы, должны подключаться разные функции
         * Срабатывает для каждой подписки
         * chn {array}
         */
        token = script_PubSub.subscribe('NODEJS:subscribed', function(subscription, chn) {
            //console.log('Info Attention >>> instances %o', ChatInstances.getInstances());
            console.log('INFO >>> subscribed to %o', chn);
            var chatName = ChatInstances.makeChatName(chn);
            var instance = ChatInstances.getChatInstance(chatName);

            instance.clearChatAndLH();

            /** Режимы чата **/
            switch (ChatInstances.getChatType(chatName)){
                case 'twoChats':
                    if (instance.elements.send && instance.elements.send.length > 0) {
                        if (!instance.interfaceSendMsg) {
                            instance.interfaceSendMsg = new ClassInterfaceSendMessage({
                                auth:USER_OBJECT.checkAuth(),
                                pageType: instance.param.type,
                                chat: instance
                            });
                        }
                        instance.interfaceSendMsg.enable(true);
                    }
                    if (instance.elements.history && instance.elements.history.length > 0) {
                        if (!instance.interfaceHistory){
                            instance.interfaceHistory = new ClassInterfaceChatHistory({
                                U_O: USER_OBJECT,
                                chat: instance
                            });
                        }
                    }
                    script_BE.sendToPHP('history/last',{channel:chn});
                    break;
                case 'stream':
                    console.log('CHAT INSTANCE for STREAMS %o', instance);
                    if (instance.elements.send && instance.elements.send.length > 0) {
                        if (!instance.interfaceSendMsg) {
                            instance.interfaceSendMsg = new ClassInterfaceSendMessage({
                                auth:USER_OBJECT.checkAuth(),
                                pageType: instance.param.type,
                                chat: instance
                            });
                        } else {
                            instance.interfaceSendMsg.enable(true);
                            instance.interfaceSendMsg.bind();
                        }
                        //instance.interfaceSendMsg.enable(true);
                    }
                    if (instance.elements.history && instance.elements.history.length > 0) {
                        if (!instance.interfaceHistory){
                            instance.interfaceHistory = new ClassInterfaceChatHistory({
                                U_O: USER_OBJECT,
                                chat: instance
                            });
                        } else {
                            instance.interfaceHistory.bindAuth();
                            instance.interfaceHistory.updateSettings();
                        }
                    }
                    script_BE.sendToPHP('history/last',{channel:chn});
                    break;
                case 'privateRoom':
                    console.log('CHAT INSTANCE for ROOMS %o', instance);
                    if (instance.elements.send && instance.elements.send.length > 0) {
                        if (!instance.interfaceSendMsg) {
                            instance.interfaceSendMsg = new ClassInterfaceSendMessage({
                                auth:USER_OBJECT.checkAuth(),
                                pageType: instance.param.type,
                                chat: instance
                            });
                        } else {
                            instance.interfaceSendMsg.enable(true);
                            instance.interfaceSendMsg.bind();
                        }
                    }
                    if (instance.elements.history && instance.elements.history.length > 0) {
                        //console.log('instance.param.deleteTime %o', instance.param.deleteTime);
                        if (!instance.interfaceHistory) {
                            instance.interfaceHistory = new ClassInterfaceChatHistory({
                                U_O: USER_OBJECT,
                                chat: instance,
                                settings: {
                                    msgAutoDelTime: (instance.param.deleteTime && instance.param.deleteTime !== 0 ) ? instance.param.deleteTime*1000 : undefined
                                }
                            });
                        } else {
                            instance.interfaceHistory.bindAuth();
                            instance.interfaceHistory.updateSettings();
                        }
                    }
                    script_BE.sendToPHP('history/last',{channel:chn});
                    // добавление
                    if (instance.param.sharedContent){
                        script_PubSub.publish('NODEJS:Messages', {mode:'normal',data:instance.param.sharedContent});
                        instance.param.sharedContent = null;
                    } else if (instance.param.sharedContent !== null) {
                        GalleryOnPage.setCapMainPlayer(USER_OBJECT.checkAuth() && instance.param.pageOwner === USER_OBJECT.get().user.userName);
                    }
                    break;
                case 'lookStream':
                    //console.log('%cWARNING >>> this type of page is in design', 'color:red');
                    /*if (instance.elements.send && instance.elements.send.length > 0) {
                        if (!instance.interfaceSendMsg) instance.interfaceSendMsg = new ClassInterfaceSendMessage({
                            auth:USER_OBJECT.checkAuth(),
                            pageType: instance.param.type,
                            chat: instance
                        });
                        instance.interfaceSendMsg.enable(true);
                    }*/
                    if (instance.elements.history && instance.elements.history.length > 0) {
                        //console.log('instance.param.deleteTime %o', instance.param.deleteTime);
                        if (!instance.interfaceHistory){
                            instance.interfaceHistory = new ClassInterfaceChatHistory({
                                U_O: USER_OBJECT,
                                chat: instance,
                                settings: {
                                    msgAutoDelTime: (instance.param.deleteTime && instance.param.deleteTime !== 0 ) ? instance.param.deleteTime*1000 : undefined,
                                    disableScrollStop: true,
                                    disableLoadHistoryForScrollTop: true,
                                    allowHighlightMsg: true
                                }
                            });
                        }
                    }
                    LookStreamController.init({
                        chat: instance
                    });
                    //script_BE.sendToPHP('history/last',{channel:chn});
                    break;
                default:
                    console.log('ERROR >>> неизвестный type страницы: %s', ChatInstances.getChatType(chatName));
                    break;
            }
            if (!somePostMethods.isStarted()) {
                somePostMethods.start();
            }
        });
        tokenToUnsub.push(token);

        /**
         * CLOSE (unsubsribe)
         */
        token = script_PubSub.subscribe('NODEJS:Close', function(subscription, evt) {
            // clean all chats
            var chats = ChatInstances.getChatNames(),
                instance;
            for (var i=0; i < chats.length; i++) {
                instance = ChatInstances.getChatInstance(chats[i]);
                if (instance.interfaceSendMsg) {
                    instance.interfaceSendMsg.enable(false);
                    //instance.clearChatAndLH();
                }
            }
            onlineStatus = false;
        });
        tokenToUnsub.push(token);
        /**
         * OPEN (after reconnect)
         */
        token = script_PubSub.subscribe('NODEJS:open', function(subscription, evt) {
            var chats = ChatInstances.getChatNames(),
                instance;
            for (var i=0; i < chats.length; i++) {
                instance = ChatInstances.getChatInstance(chats[i]);
                if (instance.interfaceHistory) {
                    instance.clearChatAndLH();
                }

            }
        });
        tokenToUnsub.push(token);

        /**
         * MESSAGES && HISTORY
         * получение сообщений и истории
         */
        token = script_PubSub.subscribe('NODEJS:Messages', function (subscription, received) {
            var chatName,
                additional; // дополнительные параметры к сообщению
            switch (received.mode) {
                case 'normal':
                    if (ChatInstances.getChatNames().length === 1) { //если только один чат, то брать его
                        chatName = ChatInstances.getChatNames()[0];
                    } else {
                        chatName = ChatInstances.getChatNameThatOwnsChn(received.data.channel);
                    }
                    if (!chatName) {
                        console.log('%cERROR >>> у сообщения нету свойства channel %o', 'color:red', received.data.messages[e].data);
                    } else {
                        ChatInstances.getChatInstance(chatName).receiveNewMsg(received.data);
                    }
                    //console.log('MESSAGEA %o', received.data);
                    break;
                case 'likes':
                    if (GalleryOnPage) {
                        GalleryOnPage.addLikeToBlock(received.data.msgId,received.data.likes_ac);
                    }
                    break;
                case 'historyLast':
                    console.log('historyLast received %h', received);
                    additional = {
                        type: 'history'
                    };
                    received.data.messages.reverse();//поменять порядок сообщений
                    for (var e=0; e<received.data.messages.length;e++) {
                        received.data.messages[e].data.sound = false;
                        if (ChatInstances.getChatNames().length === 1) { //если только один чат, то брать его
                            chatName = ChatInstances.getChatNames()[0];
                        } else {
                            chatName = ChatInstances.getChatNameThatOwnsChn(received.data.messages[e].data.channel);
                        }
                        if (!chatName) {
                            console.log('%cERROR >>> у сообщения нету свойства channel %o', 'color:red', received.data.messages[e].data);
                        } else {
                            ChatInstances.getChatInstance(chatName).receiveNewMsg(received.data.messages[e].data,additional);
                        }
                    }
                    break;
                case 'historyFirst':
                    console.log('historyFirst received %o', received);
                    //received.data.messages.reverse();//поменять порядок сообщений
                    for (var z=0; z<received.data.messages.length;z++) {
                        if (ChatInstances.getChatNames().length === 1) { //если только один чат, то брать его
                            chatName = ChatInstances.getChatNames()[0];
                        } else {
                            chatName = ChatInstances.getChatNameThatOwnsChn(received.data.messages[z].data.channel);
                        }
                        if (!chatName) {
                            console.log('%cERROR >>> у сообщения нету свойства channel %o', 'color:red', received.data.messages[z].data);
                        } else {
                            ChatInstances.getChatInstance(chatName).receiveNewMsg(received.data.messages[z].data);
                        }
                    }
                    break;
                case 'historyAfter':
                    console.log('Chat >> historyAfter Received %o', received);
                    additional = {
                        type: 'history-after',
                        direction: '',
                        allCount: received.data.messages.length-1,
                        thisCount: ''
                    };

                    //received.data.messages.reverse();//поменять порядок сообщений
                    for (var d=0; d<received.data.messages.length;d++) {
                        received.data.messages[d].data.sound = false;
                        additional.thisCount = d;
                        if (ChatInstances.getChatNames().length === 1) { //если только один чат, то брать его
                            chatName = ChatInstances.getChatNames()[0];
                        } else {
                            chatName = ChatInstances.getChatNameThatOwnsChn(received.data.messages[d].data.channel);
                        }
                        if (!chatName) {
                            console.log('%cERROR >>> у сообщения нету свойства channel %o', 'color:red', received.data.messages[d].data);
                        } else {
                            ChatInstances.getChatInstance(chatName).receiveNewMsg(received.data.messages[d].data,additional);
                        }
                    }
                    break;
                case 'historyBefore':
                    console.log('Chat >> historyBefore Received %o', received);
                    additional = {
                        type: 'history',
                        direction: 'top',
                        allCount: received.data.messages.length-1,
                        thisCount: ''
                    };
                    for (var k= 0, len=received.data.messages.length; k<len;k++) {
                        received.data.messages[k].data.sound = false;
                        additional.thisCount = k;
                        if (ChatInstances.getChatNames().length === 1) { //если только один чат, то брать его
                            chatName = ChatInstances.getChatNames()[0];
                        } else {
                            chatName = ChatInstances.getChatNameThatOwnsChn(received.data.messages[k].data.channel);
                        }
                        if (!chatName) {
                            console.log('%cERROR >>> у сообщения нету свойства channel %o', 'color:red', received.data.messages[k].data);
                        } else {
                            ChatInstances.getChatInstance(chatName).receiveNewMsg(received.data.messages[k].data,additional);
                        }
                    }
                    break;
                case 'delete':
                    if (!received.data.channel) {
                        console.log('%cERROR >>> с БЕ приходит старая версия структуры сообщения (без указания канала)', 'color:red');
                        break;
                    }
                    if (ChatInstances.getChatNames().length === 1) { //если только один чат, то брать его
                        chatName = ChatInstances.getChatNames()[0];
                    } else {
                        chatName = ChatInstances.getChatNameThatOwnsChn(received.data.channel);
                    }
                    if (!chatName) {
                        console.log('%cERROR >>> у сообщения нету свойства channel %o', 'color:red', received.data.messages[e].data);
                    } else {
                        ChatInstances.getChatInstance(chatName).deleteMsg(received.data.id);
                    }
                    break;
                default:
                    console.log('WARNING >>> неизвестный mode сообщения %o', received.mode);
                    break;
            }
        });
        tokenToUnsub.push(token);

        token = script_PubSub.subscribe('POST:chat/userCount', function (subscription, pubSubReceived) {
            var k;
            try {
                k = JSON.parse(pubSubReceived[0]);
            } catch (e) {
                console.log('ERROR >>> POST:chat/userCount ошибка парсинга');
            }
            var chat = ChatInstances.getChatInstance(ChatInstances.getChatNameThatOwnsChn(pubSubReceived[1][0]));
            if (chat.interfaceHistory) {
                chat.interfaceHistory.showCountOfUsersOnChannel(k);
            }
        });
        tokenToUnsub.push(token);

        token = script_PubSub.subscribe('POST:chat/getContextMenu', function (subscription, pubSubReceived) {
            var phpResponseText = pubSubReceived[0];
            // берем первый чат за основу и его контекст меню
            ChatInstances.getChatInstance(ChatInstances.getChatNames()[0]).interfaceHistory.showContextMenu(true,pubSubReceived[1],phpResponseText);
            var htmlString ='';
            var massiveA = phpResponseText.substr(1,phpResponseText.length-2);
            massiveA = massiveA.split(',');

            for (var i=0; i<massiveA.length; i++) {
                htmlString += '';
            }
        });
        tokenToUnsub.push(token);

        return {

        };
    })();

    console.log('%cINFO >>> chat module ready. Waiting for USER_OBJECT', 'color:green');
    /*console.log('Info >>> instances %o', ChatInstances.getInstances());
    setTimeout(function(){
        console.log('Info >>> instances %o', ChatInstances.getInstances());
    }, 4000)*/

    //console.log('%cVideoPlayer Testing %o', 'color:blue;font:bold;' ,VideoPlayer.test());
    window.Testing = (function(){
        var links = {
            video: [
                'http://www.twitch.tv/taupedaug/c/5926312', //twitch video
                'http://www.twitch.tv/atilla_wot', //twitch stream
                'http://cybergame.tv/videos/1369048-dota-2/', // cybergame video
                'http://cybergame.tv/kromsalovo/', // cybergame stream
                'http://goodgame.ru/channel/Peptar/', // goodgame stream
                //'http://www.dailymotion.com/video/x2fr9wh_farmville-2-hacks-money-fertiliezer-unlimited-free-items-favors-cheats-engine-6-2-farm-bucks-6-3-lev_videogames', // dailymotion video
                'http://www.youtube.com/watch?v=dwzkGelW-iQ', //youtube video
                'http://vimeo.com/66585349', // vimeo numeric id video
                'http://vimeo.com/groups/filmschool/videos/116200417', // vimeo groups
                'http://vimeo.com/channels/nicetype/116668949' // vimeo channels
            ],
            images: [
                'https://41.media.tumblr.com/25b2961ba5dd052e7ce0503b603675e1/tumblr_nipwq1mfiw1s5cyzso1_500.jpg', // jpg vertical
                'http://www.whoateallthepies.tv/wp-content/uploads/2013/10/im1NpZg.gif', //gif
                'http://i.stack.imgur.com/ILTQq.png' // png
            ]
        };

        // Private
        /**
         * Возвращает рандомную ссылку из объекта с предзаданными ссылками
         * @returns {*}
         */
        function getSomeLink() {
            var tmp;
            tmp = [];
            for (var key in links) {
                if (links.hasOwnProperty(key)) {
                    tmp.push(key);
                }
            }
            tmp = tmp[getRandomInt(0, tmp.length - 1)];
            return links[tmp][getRandomInt(0, links[tmp].length - 1)];
        }
        function getRandomInt(min, max)
        {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        // Public
        function addGalleryBlock() {
            $('#msgToSend').val(getSomeLink());
            $('#send').click();
        }

        function addMainAdditionalContent() {

            //$('.add_link').click();
            $('.add_link_popup').find('input').val(getSomeLink());
            $('.add_link_popup').find('.blue_but').click();
            //$('.add_link').click();
        }

        function addAllTypeGalleryBlocks() {
            var allLinks = '';
            for (var key in links) {
                if (links.hasOwnProperty(key)) {
                    for (var i=0; i < links[key].length; i++) {
                        allLinks += links[key][i] + ' ';
                        $('#msgToSend').val(links[key][i]);
                        $('#send').click();
                    }
                }
            }
            /*$('#msgToSend').val(allLinks);
            $('#send').click();*/
        }

        function lastHistory() {
            script_BE.sendToPHP('history/last',{channel:ChatInstances.getChatChannels(ChatInstances.getChatNames()[0])});
            //console.log('Vot %o', ChatInstances.getChatChannels(ChatInstances.getChatNames()[0]));
        }

        function getMsgIdForTime(timestamp) {
            script_BE.sendToPHP('history/time', {channel:ChatInstances.getChatChannels(ChatInstances.getChatNames()[0]),time:timestamp});
            script_PubSub.subscribe('POST:history/time', function(subscription, data){
                console.log('POST:history/time message id for that time %b', data[0]);
            });
        }

        return {
            addMainAdditionalContent: addMainAdditionalContent,
            addGalleryBlock: addGalleryBlock,
            addAllTypeGalleryBlocks: addAllTypeGalleryBlocks,
            lastHistory: lastHistory,
            getMsgForTime: getMsgIdForTime,
            lookStreamLocalHistory: function() {
                console.log(LookStreamModel.getLocalHistory());
            },
            test: function() {
                console.log(ChatInstances.getFirstChatInstance());
                ChatInstances.getFirstChatInstance().deleteMsg();
            }
        };
    })();
    /*window.Chat_Init = function(){
        console.log('%cWarning >>> функция Chat_Init() уже вызывалась', 'color:red');
        script_BE.sendToPHP('chat/uo');
    }*/
    window.testTokenToUnsub = tokenToUnsub;
};
