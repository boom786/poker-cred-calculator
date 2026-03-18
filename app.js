let playerCount = 0;

function chipValue() {
  const rupees = parseFloat(document.getElementById('rupees').value) || 1;
  const chips = parseFloat(document.getElementById('chipsPerRupee').value) || 5;
  return rupees / chips; // rupees per chip
}

function updateChipNote() {
  const rupees = parseFloat(document.getElementById('rupees').value) || 1;
  const chips = parseFloat(document.getElementById('chipsPerRupee').value) || 5;
  const chipsPerBuyin = parseFloat(document.getElementById('chipsPerBuyin').value) || 500;
  const buyinCost = (chipsPerBuyin * rupees / chips).toFixed(2).replace(/\.?0+$/, '');
  document.getElementById('chipNote').textContent =
    `₹${rupees} = ${chips} chips  |  1 buy-in (${chipsPerBuyin} chips) = ₹${buyinCost}`;
}

document.getElementById('rupees').addEventListener('input', updateChipNote);
document.getElementById('chipsPerRupee').addEventListener('input', updateChipNote);
document.getElementById('chipsPerBuyin').addEventListener('input', updateChipNote);

function addPlayer(name = '', chips = '') {
  playerCount++;
  const id = playerCount;
  const div = document.createElement('div');
  div.className = 'player-row';
  div.id = `player-${id}`;
  div.innerHTML = `
    <div class="player-field">
      <span class="field-label">Name</span>
      <input type="text" placeholder="Player name" value="${name}" class="pname" />
    </div>
    <div class="player-field">
      <span class="field-label">Buy-ins</span>
      <input type="number" placeholder="1" value="1" class="pbuyin" min="1" />
    </div>
    <div class="player-field">
      <span class="field-label">Final chips</span>
      <input type="number" placeholder="0" value="${chips}" class="pchips" min="0" />
    </div>
    <button class="btn-remove" onclick="removePlayer(${id})">✕</button>
  `;
  document.getElementById('playerList').appendChild(div);
}

function removePlayer(id) {
  const el = document.getElementById(`player-${id}`);
  if (el) el.remove();
}

function resetResults() {
  document.getElementById('results').innerHTML = '';
  document.getElementById('errorMsg').textContent = '';
}

function calculate() {
  resetResults();
  const rows = document.querySelectorAll('.player-row');
  const chipsPerBuyin = parseFloat(document.getElementById('chipsPerBuyin').value) || 500;
  const cval = chipValue();
  const buyinCost = chipsPerBuyin * cval; // rupee cost of one buy-in

  if (rows.length < 2) {
    document.getElementById('errorMsg').textContent = 'Add at least 2 players.';
    return;
  }

  const players = [];
  for (const row of rows) {
    const name = row.querySelector('.pname').value.trim();
    const buyins = parseFloat(row.querySelector('.pbuyin').value) || 1;
    const chips = parseFloat(row.querySelector('.pchips').value);
    if (!name) { document.getElementById('errorMsg').textContent = 'All players need a name.'; return; }
    if (isNaN(chips) || chips < 0) { document.getElementById('errorMsg').textContent = `Enter valid chip count for ${name}.`; return; }
    const net = (chips * cval) - (buyins * buyinCost);
    players.push({ name, net });
  }

  // validate: total chips in play must equal sum of final chips
  const totalChipsInPlay = players.reduce((sum, _, i) => {
    const row = rows[i];
    return sum + (parseFloat(row.querySelector('.pbuyin').value) || 1) * chipsPerBuyin;
  }, 0);
  const totalFinalChips = Array.from(rows).reduce((sum, row) => sum + (parseFloat(row.querySelector('.pchips').value) || 0), 0);

  if (Math.abs(totalChipsInPlay - totalFinalChips) > 0.5) {
    document.getElementById('errorMsg').textContent =
      `Chip mismatch: total buy-in chips = ${totalChipsInPlay}, total final chips = ${totalFinalChips}. They must be equal.`;
    return;
  }

  const creditors = players.filter(p => p.net > 0.005).map(p => ({ ...p }));
  const debtors = players.filter(p => p.net < -0.005).map(p => ({ ...p }));

  const transactions = [];
  let ci = 0, di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci];
    const d = debtors[di];
    const amount = Math.min(c.net, -d.net);
    transactions.push({ from: d.name, to: c.name, amount });
    c.net -= amount;
    d.net += amount;
    if (Math.abs(c.net) < 0.005) ci++;
    if (Math.abs(d.net) < 0.005) di++;
  }

  const resultsDiv = document.getElementById('results');

  if (transactions.length === 0) {
    resultsDiv.innerHTML = '<div class="balanced">✅ Everyone is even — no settlements needed!</div>';
    return;
  }

  transactions.forEach(t => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
      <span class="payer">${t.from}</span>
      <span class="arrow">pays</span>
      <span class="receiver">${t.to}</span>
      <span class="amount">₹${t.amount.toFixed(2)}</span>
    `;
    resultsDiv.appendChild(div);
  });
}

// init with 4 players
addPlayer(); addPlayer(); addPlayer(); addPlayer();
updateChipNote();
