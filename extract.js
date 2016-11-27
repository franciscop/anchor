JSON.stringify([...$('table.good').querySelectorAll('tr')].map(one => {
  var tr = [...one.querySelectorAll('td')];
  if (!tr.length) return;
  return {
    kanji: tr[0].textContent,
    hiragana: tr[1].textContent,
    english: tr[2].textContent
  };
}), null, 2);
