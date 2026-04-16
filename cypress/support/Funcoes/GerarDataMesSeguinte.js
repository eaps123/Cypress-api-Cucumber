function GerarDataMesSeguinte() {
    const now = new Date();
    // próximo mês (0-based month). se mês for 11 (dez) o year avança automaticamente ao criar Date.
    const nextMonthIndex = now.getMonth() + 1;
    const nextYear = now.getFullYear() + Math.floor(nextMonthIndex / 12);
    const normalizedMonth = nextMonthIndex % 12;

    // último dia do mês alvo
    const lastDayOfNextMonth = new Date(nextYear, normalizedMonth + 1, 0).getDate();
    const day = Math.min(now.getDate(), lastDayOfNextMonth);

    const next = new Date(nextYear, normalizedMonth, day);

    // formata YYYY-MM-DD (local, sem efeitos de timezone)
    const yyyy = next.getFullYear();
    const mm = String(next.getMonth() + 1).padStart(2, '0');
    const dd = String(next.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
}

export default GerarDataMesSeguinte;