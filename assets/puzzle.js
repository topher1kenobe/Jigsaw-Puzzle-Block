(function(){
  'use strict';

  function shuffleArray(arr){
    for(var i=arr.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var t=arr[i]; arr[i]=arr[j]; arr[j]=t;
    }
    return arr;
  }

  function buildBulgeArrays(rows, cols){
    var hBulge = [];
    for(var r=0;r<rows-1;r++){
      var row=[];
      for(var c=0;c<cols;c++) row.push(Math.random()<0.5?1:-1);
      hBulge.push(row);
    }
    var vBulge = [];
    for(var r2=0;r2<rows;r2++){
      var row2=[];
      for(var c2=0;c2<cols-1;c2++) row2.push(Math.random()<0.5?1:-1);
      vBulge.push(row2);
    }
    return {hBulge:hBulge, vBulge:vBulge};
  }

  var TAB_T = 0.1;
  var TAB_TABLE = [
    [0.0,0],[0.2,0],[0.5,-TAB_T],[0.4,TAB_T],[0.3,3*TAB_T],
    [0.7,3*TAB_T],[0.6,TAB_T],[0.5,-TAB_T],[0.8,0],[1.0,0]
  ];
  function edgePoints(ax,ay,bx,by,bulge){
    var dx=bx-ax, dy=by-ay;
    var L = Math.sqrt(dx*dx+dy*dy);
    var ux=dx/L, uy=dy/L;
    var vx=-uy, vy=ux;
    return TAB_TABLE.map(function(p){
      var l=p[0], w=p[1]*bulge;
      return (ax+ux*L*l+vx*L*w)+' '+(ay+uy*L*l+vy*L*w);
    });
  }
  function edgeForward(ax,ay,bx,by,bulge){
    var P = edgePoints(ax,ay,bx,by,bulge);
    return 'C '+P[1]+' '+P[2]+' '+P[3]+' C '+P[4]+' '+P[5]+' '+P[6]+' C '+P[7]+' '+P[8]+' '+P[9];
  }
  function edgeReverse(ax,ay,bx,by,bulge){
    var P = edgePoints(ax,ay,bx,by,bulge);
    return 'C '+P[8]+' '+P[7]+' '+P[6]+' C '+P[5]+' '+P[4]+' '+P[3]+' C '+P[2]+' '+P[1]+' '+P[0];
  }

  function buildPiecePath(r,c,w,h,pad,hBulge,vBulge,rows,cols){
    var ox = pad, oy = pad;
    var d = 'M '+ox+' '+oy+' ';
    if(r===0){
      d += 'L '+(ox+w)+' '+oy+' ';
    } else {
      d += edgeForward(ox,oy,ox+w,oy,hBulge[r-1][c])+' ';
    }
    if(c===cols-1){
      d += 'L '+(ox+w)+' '+(oy+h)+' ';
    } else {
      d += edgeForward(ox+w,oy,ox+w,oy+h,vBulge[r][c])+' ';
    }
    if(r===rows-1){
      d += 'L '+ox+' '+(oy+h)+' ';
    } else {
      d += edgeReverse(ox,oy+h,ox+w,oy+h,hBulge[r][c])+' ';
    }
    if(c===0){
      d += 'L '+ox+' '+oy+' Z';
    } else {
      d += edgeReverse(ox,oy,ox,oy+h,vBulge[r][c-1])+' Z';
    }
    return d;
  }

  function loadImageEl(src){
    return new Promise(function(resolve,reject){
      var img = new Image();
      img.onload = function(){ resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function openSimpleLightbox(container, imageUrl, imageAlt){
    var overlay = document.createElement('div');
    overlay.className = 'jgp-lightbox';

    var box = document.createElement('div');
    box.className = 'jgp-lightbox-box';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'jgp-lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u00d7';

    var img = document.createElement('img');
    img.className = 'jgp-lightbox-img';
    img.src = imageUrl;
    img.alt = imageAlt || '';

    box.appendChild(closeBtn);
    box.appendChild(img);
    overlay.appendChild(box);
    container.appendChild(overlay);

    function close(){
      if(overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    overlay.addEventListener('click', function(e){
      if(e.target === overlay) close();
    });
    closeBtn.addEventListener('click', close);
  }

  function buildPuzzleUI(container, imageUrl, imageAlt, rows, cols, creditLink, onRestart, imageId){
    container.classList.add('jgp-app');
    container.innerHTML = '';

    var controls = document.createElement('div');
    controls.className = 'jgp-controls';
    var shuffleBtn = document.createElement('button');
    shuffleBtn.type = 'button';
    shuffleBtn.className = 'jgp-btn';
    shuffleBtn.textContent = 'Shuffle pieces';

    var viewImageBtn = document.createElement('button');
    viewImageBtn.type = 'button';
    viewImageBtn.className = 'jgp-btn';
    viewImageBtn.textContent = 'View Image';
    viewImageBtn.addEventListener('click', function(){
      openSimpleLightbox(container, imageUrl, imageAlt);
    });

    var bookmarkBtn = document.createElement('button');
    bookmarkBtn.type = 'button';
    bookmarkBtn.className = 'jgp-btn';
    bookmarkBtn.textContent = 'Bookmark this image';
    bookmarkBtn.addEventListener('click', function(){
      if(!imageId) return;
      var url = new URL(window.location.href);
      url.searchParams.set('image', imageId);
      window.history.replaceState(null, '', url.toString());
      var original = bookmarkBtn.textContent;
      bookmarkBtn.textContent = 'Link updated \u2014 bookmark this page!';
      bookmarkBtn.disabled = true;
      setTimeout(function(){
        bookmarkBtn.textContent = original;
        bookmarkBtn.disabled = false;
      }, 2500);
    });

    var trayLabel = document.createElement('span');
    trayLabel.className = 'jgp-tray-label';
    trayLabel.textContent = 'Pile \u2014 drag a piece onto the board';
    var progressEl = document.createElement('span');
    progressEl.className = 'jgp-progress';
    controls.appendChild(shuffleBtn);
    controls.appendChild(viewImageBtn);
    controls.appendChild(bookmarkBtn);
    controls.appendChild(trayLabel);
    controls.appendChild(progressEl);

    var workspace = document.createElement('div');
    workspace.className = 'jgp-workspace';

    var boardWrap = document.createElement('div');
    boardWrap.className = 'jgp-board-wrap';
    var winBanner = document.createElement('div');
    winBanner.className = 'jgp-win-banner';
    var winText = document.createElement('span');
    winText.className = 'jgp-win-text';
    winText.textContent = 'Solved! Nicely done.';
    var againBtn = document.createElement('button');
    againBtn.type = 'button';
    againBtn.className = 'jgp-btn jgp-btn-sm jgp-win-again';
    againBtn.textContent = 'Do Another Puzzle';
    againBtn.addEventListener('click', function(){
      if(onRestart) onRestart();
    });
    winBanner.appendChild(winText);
    winBanner.appendChild(againBtn);
    var boardEl = document.createElement('div');
    boardEl.className = 'jgp-board';
    boardWrap.appendChild(winBanner);
    boardWrap.appendChild(boardEl);

    var trayWrap = document.createElement('div');
    trayWrap.className = 'jgp-tray-wrap';
    var trayEl = document.createElement('div');
    trayEl.className = 'jgp-tray';
    trayWrap.appendChild(trayEl);

    workspace.appendChild(boardWrap);
    workspace.appendChild(trayWrap);

    container.appendChild(controls);
    container.appendChild(workspace);

    if(creditLink){
      var credit = document.createElement('p');
      credit.className = 'jgp-credit';
      var creditA = document.createElement('a');
      creditA.href = creditLink;
      creditA.target = '_blank';
      creditA.rel = 'noopener noreferrer';
      creditA.textContent = 'Photo via WordPress.org Photo Directory';
      credit.appendChild(creditA);
      container.appendChild(credit);
    }

    var state = {
      rows: rows, cols: cols,
      pieceW: 0, pieceH: 0, pad: 0,
      hBulge: [], vBulge: [],
      pieces: [], pieceGrid: [],
      slotFilled: [],
      imgSrc: imageUrl,
      imgTotalW: 0, imgTotalH: 0,
      placedCount: 0,
      tol: 0
    };

    var dragCtx = null;

    var TRAY_MIN_WIDTH = 170;
    var BOARD_MIN_WIDTH = 340;
    var BOARD_MAX_WIDTH = 1100;
    var GAP = 22;
    var SIDE_BY_SIDE_MIN = BOARD_MIN_WIDTH + GAP + TRAY_MIN_WIDTH; // 532

    function computeTargetWidth(containerW){
      var stacked = containerW < SIDE_BY_SIDE_MIN;
      if(stacked){
        // Not enough room for board + tray side by side: the tray will sit
        // below the board (see the matching CSS), so let the board use the
        // full available width instead of an arbitrary cap.
        return Math.max(280, containerW);
      }
      // Side by side: give the board roughly two-thirds of the width and
      // let the tray have the rest, rather than always maxing the board out
      // and leaving the tray cramped at its bare minimum on wide pages.
      var idealBoard = containerW * 0.68;
      var maxAllowed = Math.min(BOARD_MAX_WIDTH, containerW - GAP - TRAY_MIN_WIDTH);
      return Math.max(BOARD_MIN_WIDTH, Math.min(maxAllowed, idealBoard));
    }

    function getGridNeighbor(piece, dr, dc){
      var r = piece.r+dr, c = piece.c+dc;
      if(r<0||c<0||r>=state.rows||c>=state.cols) return null;
      return state.pieceGrid[r][c];
    }

    function updateProgress(){
      var total = state.rows*state.cols;
      progressEl.textContent = state.placedCount+' of '+total+' placed';
      if(state.placedCount===total){
        winBanner.classList.add('show');
      } else {
        winBanner.classList.remove('show');
      }
    }

    function clearPointerLayout(el){
      el.style.position='';
      el.style.left='';
      el.style.top='';
      el.style.zIndex='';
    }

    function scatterInTray(el){
      var tw = trayEl.clientWidth || 400;
      var th = trayEl.clientHeight || 280;
      var pw = parseFloat(el.style.width) || 80;
      var ph = parseFloat(el.style.height) || 80;
      var maxX = Math.max(tw-pw, 4);
      var maxY = Math.max(th-ph, 4);
      el.style.left = (Math.random()*maxX)+'px';
      el.style.top = (Math.random()*maxY)+'px';
      el.style.transform = 'rotate('+(Math.random()*30-15).toFixed(1)+'deg)';
    }

    function onPointerDown(e, pieceData, el){
      if(pieceData.placed) return;
      e.preventDefault();
      var group = pieceData.group.slice();
      el.setPointerCapture(e.pointerId);
      var members = group.map(function(p){
        p.el.style.transform = '';
        var r = p.el.getBoundingClientRect();
        p.el.style.width = r.width+'px';
        p.el.style.height = r.height+'px';
        p.el.style.position = 'fixed';
        p.el.style.left = r.left+'px';
        p.el.style.top = r.top+'px';
        p.el.style.zIndex = 1000;
        document.body.appendChild(p.el);
        return {piece:p, el:p.el, startLeft:r.left, startTop:r.top};
      });
      dragCtx = {
        piece: pieceData,
        el: el,
        members: members,
        startX: e.clientX,
        startY: e.clientY
      };
    }

    function onPointerMove(e){
      if(!dragCtx) return;
      var dx = e.clientX-dragCtx.startX;
      var dy = e.clientY-dragCtx.startY;
      dragCtx.members.forEach(function(m){
        m.el.style.left = (m.startLeft+dx)+'px';
        m.el.style.top = (m.startTop+dy)+'px';
      });
    }

    function attemptMerges(group){
      var tol = state.tol;
      var changed = true;
      while(changed){
        changed = false;
        for(var i=0;i<group.length && !changed;i++){
          var p = group[i];
          var dirs = [[-1,0],[1,0],[0,-1],[0,1]];
          for(var k=0;k<dirs.length;k++){
            var np = getGridNeighbor(p, dirs[k][0], dirs[k][1]);
            if(!np || !np.el || group.indexOf(np)!==-1) continue;
            if(np.el.parentNode!==boardEl) continue;
            var pLeft = parseFloat(p.el.style.left), pTop = parseFloat(p.el.style.top);
            var nLeft = parseFloat(np.el.style.left), nTop = parseFloat(np.el.style.top);
            var expectedDx = (np.c-p.c)*state.pieceW;
            var expectedDy = (np.r-p.r)*state.pieceH;
            var actualDx = nLeft-pLeft, actualDy = nTop-pTop;
            if(Math.abs(actualDx-expectedDx)<=tol && Math.abs(actualDy-expectedDy)<=tol){
              var groupHasLocked = group.some(function(x){ return x.placed; });
              var npHasLocked = np.group.some(function(x){ return x.placed; });
              if(groupHasLocked && !npHasLocked){
                var shiftX2 = (pLeft+expectedDx)-nLeft;
                var shiftY2 = (pTop+expectedDy)-nTop;
                np.group.forEach(function(ngp){
                  ngp.el.style.left = (parseFloat(ngp.el.style.left)+shiftX2)+'px';
                  ngp.el.style.top = (parseFloat(ngp.el.style.top)+shiftY2)+'px';
                });
              } else {
                var shiftX = (nLeft-expectedDx)-pLeft;
                var shiftY = (nTop-expectedDy)-pTop;
                group.forEach(function(gp){
                  if(gp.placed) return;
                  gp.el.style.left = (parseFloat(gp.el.style.left)+shiftX)+'px';
                  gp.el.style.top = (parseFloat(gp.el.style.top)+shiftY)+'px';
                });
              }
              var merged = group.concat(np.group);
              merged.forEach(function(mp){ mp.group = merged; });
              group = merged;
              changed = true;
              break;
            }
          }
        }
      }
      return group;
    }

    function lockGroup(group){
      group.forEach(function(p){
        var wasPlaced = p.placed;
        state.slotFilled[p.r][p.c] = true;
        p.placed = true;
        if(!wasPlaced) state.placedCount++;
        var el = p.el;
        clearPointerLayout(el);
        el.style.position = 'absolute';
        el.style.left = (p.c*state.pieceW - state.pad)+'px';
        el.style.top = (p.r*state.pieceH - state.pad)+'px';
        el.style.cursor = 'default';
        el.style.zIndex = 1;
        boardEl.appendChild(el);
      });
      updateProgress();
    }

    function onPointerUp(e){
      if(!dragCtx) return;
      var piece = dragCtx.piece, el = dragCtx.el;
      var group = dragCtx.members.map(function(m){ return m.piece; });
      var boardRect = boardEl.getBoundingClientRect();
      var trayRect = trayEl.getBoundingClientRect();
      var elRect = el.getBoundingClientRect();
      var cx = elRect.left+elRect.width/2;
      var cy = elRect.top+elRect.height/2;
      var onBoard = cx>=boardRect.left && cx<=boardRect.right && cy>=boardRect.top && cy<=boardRect.bottom;
      var onTray = !onBoard && cx>=trayRect.left && cx<=trayRect.right && cy>=trayRect.top && cy<=trayRect.bottom;

      if(onTray){
        group.forEach(function(p){ p.group = [p]; });
        dragCtx.members.forEach(function(m){
          var r = m.el.getBoundingClientRect();
          var left = r.left - trayRect.left;
          var top = r.top - trayRect.top;
          var maxX = Math.max(trayRect.width - r.width, 0);
          var maxY = Math.max(trayRect.height - r.height, 0);
          left = Math.max(0, Math.min(left, maxX));
          top = Math.max(0, Math.min(top, maxY));
          clearPointerLayout(m.el);
          m.el.style.transform = '';
          m.el.style.position = 'absolute';
          m.el.style.left = left+'px';
          m.el.style.top = top+'px';
          trayEl.appendChild(m.el);
        });
        dragCtx = null;
        return;
      }

      if(!onBoard){
        group.forEach(function(p){ p.group = [p]; });
        dragCtx.members.forEach(function(m){
          clearPointerLayout(m.el);
          m.el.style.position = 'absolute';
          trayEl.appendChild(m.el);
          scatterInTray(m.el);
        });
        dragCtx = null;
        return;
      }

      dragCtx.members.forEach(function(m){
        var r = m.el.getBoundingClientRect();
        var freeLeft = r.left - boardRect.left;
        var freeTop = r.top - boardRect.top;
        clearPointerLayout(m.el);
        m.el.style.position = 'absolute';
        m.el.style.left = freeLeft+'px';
        m.el.style.top = freeTop+'px';
        m.el.style.zIndex = 5;
        boardEl.appendChild(m.el);
      });

      var merged = attemptMerges(group);
      var touchesLocked = merged.some(function(p){ return p.placed; });
      var grabbedLeft = parseFloat(piece.el.style.left);
      var grabbedTop = parseFloat(piece.el.style.top);
      var targetLeft = piece.c*state.pieceW - state.pad;
      var targetTop = piece.r*state.pieceH - state.pad;
      var selfCorrect = !state.slotFilled[piece.r][piece.c] &&
        Math.abs(grabbedLeft-targetLeft)<=state.tol && Math.abs(grabbedTop-targetTop)<=state.tol;

      if(touchesLocked || selfCorrect){
        lockGroup(merged);
      }
      dragCtx = null;
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);

    function createPieceElement(piece){
      var w = state.pieceW, h = state.pieceH, pad = state.pad;
      var totalW = w+pad*2, totalH = h+pad*2;
      var el = document.createElement('div');
      el.className = 'jgp-piece';
      el.setAttribute('role','img');
      el.setAttribute('aria-label', imageAlt || 'Puzzle piece');
      el.style.position = 'absolute';
      el.style.width = totalW+'px';
      el.style.height = totalH+'px';
      el.style.backgroundImage = 'url("'+state.imgSrc+'")';
      el.style.backgroundSize = state.imgTotalW+'px '+state.imgTotalH+'px';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = (pad-piece.c*w)+'px '+(pad-piece.r*h)+'px';
      var clip = 'path("'+piece.d+'")';
      el.style.clipPath = clip;
      el.style.webkitClipPath = clip;
      el.addEventListener('pointerdown', function(e){ onPointerDown(e, piece, el); });
      piece.el = el;
      return el;
    }

    function renderBoardSlots(){
      boardEl.innerHTML = '';
      boardEl.style.width = (state.cols*state.pieceW)+'px';
      boardEl.style.height = (state.rows*state.pieceH)+'px';
      trayEl.style.height = (state.rows*state.pieceH)+'px';
      for(var r=0;r<state.rows;r++){
        for(var c=0;c<state.cols;c++){
          var slot = document.createElement('div');
          slot.className = 'jgp-slot';
          slot.style.left = (c*state.pieceW)+'px';
          slot.style.top = (r*state.pieceH)+'px';
          slot.style.width = state.pieceW+'px';
          slot.style.height = state.pieceH+'px';
          boardEl.appendChild(slot);
        }
      }
    }

    function renderTray(){
      trayEl.innerHTML = '';
      var order = shuffleArray(state.pieces.slice());
      order.forEach(function(piece){
        var el = createPieceElement(piece);
        trayEl.appendChild(el);
        scatterInTray(el);
      });
    }

    function resetToTray(){
      boardEl.querySelectorAll('.jgp-piece').forEach(function(el){ el.remove(); });
      state.pieces.forEach(function(p){ p.placed=false; p.group=[p]; });
      state.slotFilled.forEach(function(row){ row.fill(false); });
      state.placedCount = 0;
      renderTray();
      updateProgress();
    }

    function buildPuzzle(imgW, imgH){
      state.imgTotalW = imgW; state.imgTotalH = imgH;
      state.pieceW = imgW/state.cols;
      state.pieceH = imgH/state.rows;
      state.pad = Math.ceil(Math.max(state.pieceW,state.pieceH)*0.34);

      var bulges = buildBulgeArrays(state.rows,state.cols);
      state.hBulge = bulges.hBulge;
      state.vBulge = bulges.vBulge;

      state.pieces = [];
      state.slotFilled = [];
      state.pieceGrid = [];
      for(var r=0;r<state.rows;r++){
        var srow=[];
        var grow=[];
        for(var c=0;c<state.cols;c++){
          srow.push(false);
          var d = buildPiecePath(r,c,state.pieceW,state.pieceH,state.pad,state.hBulge,state.vBulge,state.rows,state.cols);
          var pieceObj = {r:r,c:c,d:d,placed:false,el:null};
          pieceObj.group = [pieceObj];
          state.pieces.push(pieceObj);
          grow.push(pieceObj);
        }
        state.slotFilled.push(srow);
        state.pieceGrid.push(grow);
      }
      state.placedCount = 0;
      state.tol = Math.min(state.pieceW,state.pieceH)*0.36;

      renderBoardSlots();
      renderTray();
      updateProgress();
    }

    shuffleBtn.addEventListener('click', function(){
      resetToTray();
    });

    loadImageEl(imageUrl).then(function(img){
      var containerW = container.clientWidth || window.innerWidth;
      var targetW = computeTargetWidth(containerW);

      var scale = targetW / img.naturalWidth;
      var displayW = targetW;
      var displayH = Math.round(img.naturalHeight*scale);
      buildPuzzle(displayW, displayH);
    }).catch(function(){
      container.innerHTML = '<p class="jgp-error">This puzzle\u2019s image couldn\u2019t be loaded.</p>';
    });
  }

  function renderPicker(container, apiUrl, rows, cols){
    container.classList.add('jgp-app');
    container.innerHTML = '';

    var picker = document.createElement('div');
    picker.className = 'jgp-picker';

    var intro = document.createElement('p');
    intro.className = 'jgp-picker-intro';
    intro.textContent = 'Choose a photo for your puzzle';
    picker.appendChild(intro);

    var form = document.createElement('form');
    form.className = 'jgp-picker-form';
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'jgp-picker-input';
    input.placeholder = 'Search photos (e.g. mountains, coffee, dog\u2026)';
    var searchBtn = document.createElement('button');
    searchBtn.type = 'submit';
    searchBtn.className = 'jgp-btn';
    searchBtn.textContent = 'Search';
    var randomBtn = document.createElement('button');
    randomBtn.type = 'button';
    randomBtn.className = 'jgp-btn jgp-btn-random';
    randomBtn.textContent = 'Choose randomly';
    randomBtn.disabled = true;
    form.appendChild(input);
    form.appendChild(searchBtn);
    form.appendChild(randomBtn);
    picker.appendChild(form);

    var status = document.createElement('p');
    status.className = 'jgp-picker-status';
    picker.appendChild(status);

    var loadMoreBtn = document.createElement('button');
    loadMoreBtn.type = 'button';
    loadMoreBtn.className = 'jgp-btn jgp-btn-sm jgp-load-more';
    loadMoreBtn.textContent = 'Load 9 more';
    loadMoreBtn.style.display = 'none';
    picker.appendChild(loadMoreBtn);

    var grid = document.createElement('div');
    grid.className = 'jgp-picker-grid';
    picker.appendChild(grid);

    var attribution = document.createElement('p');
    attribution.className = 'jgp-picker-attribution';
    attribution.textContent = 'Photos are pulled live from the WordPress.org Photo Directory.';
    picker.appendChild(attribution);

    container.appendChild(picker);

    var requestSeq = 0;
    var currentPhotos = [];
    var currentTerm = '';
    var currentTotalPages = 0; // 0 = unknown
    var currentHasMore = false;
    var loadedPage = 1;

    function selectPhoto(photo){
      buildPuzzleUI(container, photo.full, photo.description || '', rows, cols, photo.link || '', function(){
        renderPicker(container, apiUrl, rows, cols);
      }, photo.id);
    }

    function fetchResultsPage(term, page){
      var url = apiUrl + (apiUrl.indexOf('?')===-1 ? '?' : '&') + 'search=' + encodeURIComponent(term) + '&page=' + page;
      return fetch(url, { credentials: 'omit' }).then(function(res){
        if(!res.ok) throw new Error('bad response');
        return res.json();
      });
    }

    function pickRandomAcrossAll(term, totalPages, fallbackMaxPage){
      var pages = totalPages > 0 ? totalPages : Math.max(1, fallbackMaxPage || 1);
      var page = 1 + Math.floor(Math.random() * pages);
      return fetchResultsPage(term, page).then(function(data){
        var results = ((data && data.results) || []).filter(function(p){ return !!p.full; });
        if(!results.length) return null;
        return results[Math.floor(Math.random() * results.length)];
      });
    }

    function buildResultTile(photo){
      var tile = document.createElement('div');
      tile.className = 'jgp-picker-tile';

      var thumbWrap = document.createElement('div');
      thumbWrap.className = 'jgp-picker-thumb';
      var img = document.createElement('img');
      img.src = photo.thumbnail;
      img.alt = photo.description || '';
      thumbWrap.appendChild(img);
      tile.appendChild(thumbWrap);

      var actions = document.createElement('div');
      actions.className = 'jgp-picker-tile-actions';

      var useBtn = document.createElement('button');
      useBtn.type = 'button';
      useBtn.className = 'jgp-btn jgp-btn-sm';
      useBtn.textContent = 'Use';
      useBtn.title = photo.description || '';
      useBtn.addEventListener('click', function(){
        selectPhoto(photo);
      });

      var enlargeBtn = document.createElement('button');
      enlargeBtn.type = 'button';
      enlargeBtn.className = 'jgp-btn jgp-btn-sm jgp-btn-secondary';
      enlargeBtn.textContent = 'Enlarge';
      enlargeBtn.addEventListener('click', function(){
        openLightbox(photo);
      });

      actions.appendChild(useBtn);
      actions.appendChild(enlargeBtn);
      tile.appendChild(actions);

      return tile;
    }

    function updateLoadMoreVisibility(){
      loadMoreBtn.style.display = currentHasMore ? '' : 'none';
    }

    function loadMore(){
      if(loadMoreBtn.disabled) return;
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Loading\u2026';
      fetchResultsPage(currentTerm, loadedPage + 1)
        .then(function(data){
          loadedPage += 1;
          var results = ((data && data.results) || []).filter(function(p){ return !!p.full; });
          currentPhotos = currentPhotos.concat(results);
          currentTotalPages = (data && data.totalPages) || currentTotalPages;
          currentHasMore = !!(data && data.hasMore);
          randomBtn.disabled = currentPhotos.length === 0;

          var fragment = document.createDocumentFragment();
          results.forEach(function(photo){
            fragment.appendChild(buildResultTile(photo));
          });
          grid.insertBefore(fragment, grid.firstChild);

          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = 'Load 9 more';
          updateLoadMoreVisibility();
        })
        .catch(function(){
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = 'Load 9 more';
        });
    }
    loadMoreBtn.addEventListener('click', loadMore);

    function openLightbox(photo, opts){
      opts = opts || {};
      var current = photo;

      var overlay = document.createElement('div');
      overlay.className = 'jgp-lightbox';

      var box = document.createElement('div');
      box.className = 'jgp-lightbox-box';

      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'jgp-lightbox-close';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = '\u00d7';

      var img = document.createElement('img');
      img.className = 'jgp-lightbox-img';
      img.src = current.full || current.thumbnail;
      img.alt = current.description || '';

      var lbStatus = document.createElement('p');
      lbStatus.className = 'jgp-lightbox-status';

      var actions = document.createElement('div');
      actions.className = 'jgp-lightbox-actions';
      var useBtn = document.createElement('button');
      useBtn.type = 'button';
      useBtn.className = 'jgp-btn';
      useBtn.textContent = 'Use this photo';
      actions.appendChild(useBtn);

      var rerollBtn = null;
      if(opts.allowReroll){
        rerollBtn = document.createElement('button');
        rerollBtn.type = 'button';
        rerollBtn.className = 'jgp-btn jgp-btn-secondary';
        rerollBtn.textContent = 'Choose another randomly';
        actions.appendChild(rerollBtn);
      }

      box.appendChild(closeBtn);
      box.appendChild(img);
      box.appendChild(lbStatus);
      box.appendChild(actions);
      overlay.appendChild(box);
      container.appendChild(overlay);

      function close(){
        if(overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }
      overlay.addEventListener('click', function(e){
        if(e.target === overlay) close();
      });
      closeBtn.addEventListener('click', close);
      useBtn.addEventListener('click', function(){
        close();
        selectPhoto(current);
      });

      if(rerollBtn){
        rerollBtn.addEventListener('click', function(){
          rerollBtn.disabled = true;
          lbStatus.textContent = 'Picking another\u2026';
          pickRandomAcrossAll(opts.term, opts.totalPages, opts.fallbackMaxPage).then(function(next){
            rerollBtn.disabled = false;
            lbStatus.textContent = '';
            if(next){
              current = next;
              img.src = current.full || current.thumbnail;
              img.alt = current.description || '';
            } else {
              lbStatus.textContent = 'Could not find another photo. Try again.';
            }
          }).catch(function(){
            rerollBtn.disabled = false;
            lbStatus.textContent = 'Could not load another photo. Try again.';
          });
        });
      }
    }

    function runSearch(term){
      var thisRequest = ++requestSeq;
      status.textContent = 'Loading\u2026';
      grid.innerHTML = '';
      currentPhotos = [];
      currentTerm = term;
      currentTotalPages = 0;
      currentHasMore = false;
      loadedPage = 1;
      loadMoreBtn.style.display = 'none';
      randomBtn.disabled = true;
      var url = apiUrl + (apiUrl.indexOf('?')===-1 ? '?' : '&') + 'search=' + encodeURIComponent(term);
      fetch(url, { credentials: 'omit' })
        .then(function(res){
          if(!res.ok) throw new Error('bad response');
          return res.json();
        })
        .then(function(data){
          if(thisRequest !== requestSeq) return;
          var results = ((data && data.results) || []).filter(function(p){ return !!p.full; });
          currentPhotos = results;
          currentTotalPages = (data && data.totalPages) || 0;
          currentHasMore = !!(data && data.hasMore);
          randomBtn.disabled = results.length === 0;
          status.textContent = results.length ? '' : 'No photos found. Try a different search.';
          results.forEach(function(photo){
            grid.appendChild(buildResultTile(photo));
          });
          updateLoadMoreVisibility();
        })
        .catch(function(){
          if(thisRequest !== requestSeq) return;
          status.textContent = 'Could not reach the photo directory. Please try again.';
        });
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      runSearch(input.value.trim());
    });

    randomBtn.addEventListener('click', function(){
      if(randomBtn.disabled) return;
      var originalLabel = randomBtn.textContent;
      randomBtn.disabled = true;
      randomBtn.textContent = 'Picking\u2026';
      pickRandomAcrossAll(currentTerm, currentTotalPages, loadedPage).then(function(photo){
        randomBtn.disabled = currentPhotos.length === 0;
        randomBtn.textContent = originalLabel;
        if(photo){
          openLightbox(photo, { allowReroll: true, term: currentTerm, totalPages: currentTotalPages, fallbackMaxPage: loadedPage });
        }
      }).catch(function(){
        randomBtn.disabled = false;
        randomBtn.textContent = originalLabel;
      });
    });

    runSearch('');
  }

  function getRequestedImageId(){
    var params = new URLSearchParams(window.location.search);
    var raw = params.get('image');
    if(!raw) return 0;
    raw = raw.trim();
    // Sanitize: must be a clean positive integer, nothing else (no leading
    // zeros, no extra characters, capped at a sane length).
    if(!/^[1-9][0-9]{0,14}$/.test(raw)) return 0;
    return parseInt(raw, 10);
  }

  function loadSpecificImage(container, photoApiUrl, apiUrl, rows, cols, imageId){
    container.classList.add('jgp-app');
    container.innerHTML = '';
    var status = document.createElement('p');
    status.className = 'jgp-picker-status';
    status.textContent = 'Loading requested photo\u2026';
    container.appendChild(status);

    var url = photoApiUrl + (photoApiUrl.indexOf('?')===-1 ? '?' : '&') + 'id=' + encodeURIComponent(imageId);
    fetch(url, { credentials: 'omit' })
      .then(function(res){
        if(!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(function(photo){
        // Validated server-side against the real photo directory: if the ID
        // didn't correspond to an actual photo, the API call above already
        // failed (caught below) rather than returning something fabricated.
        if(!photo || !photo.full) throw new Error('invalid');
        buildPuzzleUI(container, photo.full, photo.description || '', rows, cols, photo.link || '', function(){
          renderPicker(container, apiUrl, rows, cols);
        }, photo.id);
      })
      .catch(function(){
        renderPicker(container, apiUrl, rows, cols);
      });
  }

  function initAll(){
    var nodes = document.querySelectorAll('.jigsaw-puzzle-app');
    var requestedImageId = getRequestedImageId();
    nodes.forEach(function(node){
      if(node.getAttribute('data-jgp-ready')) return;
      node.setAttribute('data-jgp-ready','1');
      var apiUrl = node.getAttribute('data-api');
      var photoApiUrl = node.getAttribute('data-photo-api');
      var rows = parseInt(node.getAttribute('data-rows'),10) || 8;
      var cols = parseInt(node.getAttribute('data-cols'),10) || 8;
      if(!apiUrl) return;
      if(requestedImageId && photoApiUrl){
        loadSpecificImage(node, photoApiUrl, apiUrl, rows, cols, requestedImageId);
      } else {
        renderPicker(node, apiUrl, rows, cols);
      }
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
