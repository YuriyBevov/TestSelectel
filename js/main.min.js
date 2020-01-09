'use strict';

// логика ползунка

(function () {
  var range = document.querySelector('.range__box');
  var rangePin = document.querySelector('.range__pin');
  var rangeLine = document.querySelector('.range__line');
  var rangeValue = document.querySelector('.range__value').value; // input value
  var MAX_VALUE = 100;


  var rangeCoordsLeft = range.getBoundingClientRect().left;

  var onMouseClick = function (evt) { // вычисляю координаты клика по ползунку
    evt.preventDefault();

    var clickCoords = evt.clientX;
    var rangeWidth = range.offsetWidth;
    var clickValue = clickCoords - rangeCoordsLeft;

    pinMoveByClick(clickValue);
  };

  var onMouseDown = function (evt) { // вычисляю координаты перемещения ползунка
    evt.preventDefault();

    var startPos = evt.clientX;

    var onMouseMove = function (evtMove) {
      evtMove.preventDefault();

      var moveCoords = evtMove.clientX;
      var shift = startPos - moveCoords;
      var rangeWidth = range.offsetWidth;
      var moveValue = rangePin.offsetLeft - shift;

      startPos = evtMove.clientX;

      pinMoveByShift(shift);
    };

    var onMouseUp = function (evtUp) {
      evtUp.preventDefault();

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      correctRangeLine(rangePin.style.left)
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  var pinMoveByShift = function (shift) {
    var rangeMinValue = rangePin.offsetLeft - shift;
    var rangeMaxValue = document.querySelector('.range__box').offsetWidth;
    var rangeLineValue = ((rangePin.offsetLeft - shift) / (rangeMaxValue / MAX_VALUE));
    var positionByShift = rangeLineValue + '%';

    if (rangeMinValue < 0) {
      positionByShift = 0;
    } if (rangeMinValue > rangeMaxValue) {
      positionByShift = MAX_VALUE + '%';
    }

    rangePin.style.left = positionByShift;
    setRangeLineWidth(positionByShift);
  }

  var pinMoveByClick = function (clickValue) { // передвигаю пин по клику
    var rangeLineValue = Math.round(clickValue / (range.offsetWidth / MAX_VALUE));
    correctRangeLine(rangeLineValue + '%')
  };

  var correctRangeLine = function (value) { // корректировка пина, передача данных в йункцию фильтровки
    var productCards = window.productCards.productCards;
    var filtering = window.filtering.filtering;

    value = value.slice(0,-1);
    if (value > 12.5 && value < 37.5) {
      value = 25;
      rangeValue = 4;
    } else if (value > 37.6 && value < 62.5) {
      value = 50;
      rangeValue = 6;
    } else if (value > 62.6 && value < 87.5) {
      value = 75;
      rangeValue = 8;
    } else if (value > 87.5) {
      value = 97.5; // чтобы пин не вылезал за пределы ползунка
      rangeValue = 12;
    } else {
      value = 1.5; // чтобы пин не вылезал за пределы ползунка
      rangeValue = 2;
    }

    var position = value + '%';
    rangePin.style.left = position;

    setRangeLineWidth(position);
    filtering(productCards, rangeValue);
  }

  var setRangeLineWidth = function (position) { // отрисовка линии ползунка
    rangeLine.style.width = position;
  }

  range.addEventListener('click', onMouseClick);
  rangePin.addEventListener('mousedown', onMouseDown);

  window.range = { // значение input value по умолчанию (6-ть)
    rangeValue: rangeValue
  }

})();

// отрисовка карточек товара

(function () {

  var fillProductCard = function(template, data) {

    var coresCount = data.cpu.cores * data.cpu.count;
    var text;

    if (coresCount <= 4) {
      text = ' ядра'
    } else {
      text = ' ядер'
    }

    var coresText = coresCount + text;

    template.querySelector('.product__name').textContent = data.name;
    template.querySelector('.product__ram').textContent = data.ram;
    template.querySelector('.product__price').textContent = data.price / 100;
    template.querySelector('.product__hdd-count').textContent = data.disk.count + ' x ';
    template.querySelector('.product__hdd-value').textContent = data.disk.value;
    template.querySelector('.product__hdd-type').textContent = data.disk.type;
    template.querySelector('.product__cpu-count').textContent = data.cpu.count + ' x ';
    template.querySelector('.product__cpu-name').textContent = data.cpu.name;
    template.querySelector('.product__cpu-cores').textContent = ' ' + coresText;
    template.querySelector('.product__gpu').textContent = data.gpu;
  }

  var createCard = function (productData) {
    var fragment = document.createDocumentFragment();
    var cardTemplate = document.querySelector('#product-card-template');

    for(var i = 0; i < productData.length; i++) {
      var productCard = cardTemplate.content.cloneNode(true);
      var currentProduct = productData[i];

      fillProductCard(productCard, currentProduct);

      fragment.appendChild(productCard);
    }
    var productsList = document.querySelector('.product__list');
    productsList.appendChild(fragment);

    var productCards = document.querySelectorAll('.product__item');

    for (var i = 0; i < productCards.length; i++) {
      productCards[i].classList.add('visually-hidden');
    }

    var filtering = window.filtering.filtering;
    var rangeValue = window.range.rangeValue;
    filtering(productCards, rangeValue);

    window.productCards = {
      productCards: productCards
    }
  }

  window.card = {
    createCard: createCard
  }
})();

// загрузка данных с сервера

(function () {
  var loaderIcon = document.querySelector('.product__preloader');

  var createCard = window.card.createCard;
  var CODE = {
    SUCCESS: 200
  };

  var URL = 'https://api.jsonbin.io/b/5df3c10a2c714135cda0bf0f/1';
  var xhr = new XMLHttpRequest();

  xhr.responseType = 'json';

  xhr.open('GET', URL);

  xhr.addEventListener('load', function () {
    if (xhr.status === CODE.SUCCESS) {
      loaderIcon.classList.add('visually-hidden');
      createCard(xhr.response);
    } else {
      document.body.textContent = 'Ошибка соединения';
    }
  });
  xhr.send();
}());

// фильтрация

(function (){

  var productList = document.querySelector('.product__list');
  var emptyCard = document.createElement('li');
  emptyCard.className = 'empty-card';
  emptyCard.style.textAlign = 'center';
  emptyCard.style.margin = '30px auto';
  emptyCard.textContent = '“Нет результатов”'
  productList.appendChild(emptyCard)
  var messageNode = document.querySelector('.empty-card');

  var filtering = function (productCards, rangeValue) {

    var gpuBtn = document.querySelector("#GPU");
    var raidBtn = document.querySelector("#RAID");
    var ssdBtn = document.querySelector("#SSD");

    var range = document.querySelector('.range__value');
    range.value = rangeValue;

    var hideElem = function () {
      for (var i = 0; i < productCards.length; i++) {
        if(!productCards[i].classList.contains('visually-hidden')) {
          productCards[i].classList.add('visually-hidden');
        }
      }
    }

    var onChangeHandler = function () {
      hideElem();

      var currentData = [];
      messageNode.classList.remove('visually-hidden');

      if (gpuBtn.checked) {
        currentData = [];
         productCards.forEach(function(item, i, productCards) {
          if (productCards[i].querySelector('.product__gpu').innerHTML) {
            currentData.push(productCards[i])
          }
        });
      }

      if (ssdBtn.checked) {
        currentData = [];
         productCards.forEach(function(item, i, productCards) {
          if (productCards[i].querySelector('.product__hdd-type').innerHTML === 'SSD') {
            currentData.push(productCards[i])
          }
        });
      }

      if (raidBtn.checked) {
        currentData = [];
         productCards.forEach(function(item, i, productCards) {
          if (productCards[i].querySelector('.product__hdd-count').innerHTML !== "1 x ") {
            currentData.push(productCards[i])
          }
        });
      }

      if (gpuBtn.checked && ssdBtn.checked) {
        currentData = [];
         productCards.forEach(function(item, i, productCards) {
           console.log('ok')
          if (productCards[i].querySelector('.product__gpu').innerHTML && productCards[i].querySelector('.product__hdd-type').innerHTML === 'SSD') {
            currentData.push(productCards[i])
          }
        });
      }

      if (gpuBtn.checked && raidBtn.checked) {
        currentData = [];
         productCards.forEach(function(item, i, productCards) {
          if (productCards[i].querySelector('.product__gpu').innerHTML && productCards[i].querySelector('.product__hdd-count').innerHTML !== "1 x ") {
            currentData.push(productCards[i])
          }
        });
      }

      if (ssdBtn.checked && raidBtn.checked) {
        currentData = [];
         productCards.forEach(function(item, i, productCards) {
          if (productCards[i].querySelector('.product__hdd-type').innerHTML === 'SSD' && productCards[i].querySelector('.product__hdd-count').innerHTML !== "1 x ") {
            currentData.push(productCards[i])
          }
        });
      }

      if (gpuBtn.checked && ssdBtn.checked && raidBtn.checked) {
        currentData = [];
         productCards.forEach(function(item, i, productCards) {
          if (productCards[i].querySelector('.product__gpu').innerHTML && productCards[i].querySelector('.product__hdd-type').innerHTML === 'SSD' && productCards[i].querySelector('.product__hdd-count').innerHTML !== "1 x ") {
            currentData.push(productCards[i])
          }
        });
      }

      if (!gpuBtn.checked && !ssdBtn.checked && !raidBtn.checked) {
         currentData = productCards;
      }

      for (var i = 0; i < currentData.length; i++) {
        if(currentData[i].querySelector('.product__cpu-cores').innerHTML.trim()[0] === range.value[0]) {
          messageNode.classList.add('visually-hidden');
          currentData[i].classList.remove('visually-hidden');
        }
      }
    }

    onChangeHandler();

    range.addEventListener('change', onChangeHandler);
    gpuBtn.addEventListener('change',  onChangeHandler);
    ssdBtn.addEventListener('change',  onChangeHandler);
    raidBtn.addEventListener('change', onChangeHandler);
  }

  window.filtering = {
    filtering: filtering
  }
})();
