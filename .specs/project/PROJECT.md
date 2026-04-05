**PROBLEMA**
Dado o seguinte log de um jogo de tiro em primeira pessoa:

23/04/2019 15:34:22 - New match 11348965 has started
23/04/2019 15:36:04 - Roman killed Nick using M16
23/04/2019 15:36:33 - <WORLD> killed Nick by DROWN
23/04/2019 15:39:22 - Match 11348965 has ended

23/04/2021 16:14:22 - New match 11348966 has started
23/04/2021 16:26:04 - Roman killed Marcus using M16
23/04/2021 16:36:33 - <WORLD> killed Marcus by DROWN
23/04/2021 16:49:22 - Match 11348966 has ended

24/04/2020 16:14:22 - New match 11348961 has started
24/04/2020 16:26:12 - Roman killed Marcus using M16
24/04/2020 16:35:56 - Marcus killed Jhon using AK47
24/04/2020 17:12:34 - Roman killed Bryian using M16
24/04/2020 18:26:14 - Bryan killed Marcus using AK47
24/04/2020 19:36:33 - <WORLD> killed Marcus by DROWN
24/04/2020 20:19:22 - Match 11348961 has ended

**Resultado esperado**
- Montar o ranking de cada partida, com a quantidade de frags* e a quantidade de mortes de cada jogador;
- Permitir que o seu código receba logs de múltiplas rodadas em um único arquivo.

**Observações** 
- Frag é quando um jogador mata outro player no jogo;
- Frags realizados pelo player WORLD devem ser desconsiderados;
- Permitir que uma rodada tenha múltiplos jogadores, limitado a 20 jogadores por partida.