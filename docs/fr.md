# UBA Air Quality

La qualité de l'air officielle en Allemagne : les stations des réseaux de
mesure des Länder, avec l'**indice de qualité de l'air** (Luftqualitätsindex)
de l'[Umweltbundesamt](https://www.umweltbundesamt.de/daten/luft/luftdaten/luftqualitaet)
(UBA, l'agence fédérale allemande de l'environnement), station par station,
heure par heure.

Non affilié à l'Umweltbundesamt. Les données viennent de son API ouverte
(`luftdaten.umweltbundesamt.de`, version 4), utilisées telles que l'UBA les
publie, sous la
[licence de données Allemagne – attribution – 2.0](https://www.govdata.de/dl-de/by-2-0)
(dl-de/by-2-0). Source : Umweltbundesamt, avec les données des réseaux de
mesure des Länder et de l'État fédéral.

## Ce que fait l'intégration

- Lit les stations de l'UBA que vous choisissez (10 au plus), sans compte ni
  clé.
- Crée **un appareil par station** : l'indice allemand de qualité de l'air
  (0 à 4) et son niveau en toutes lettres, les polluants de l'indice que la
  station mesure (PM2.5, PM10, NO₂, O₃, SO₂) et l'âge des données.
- Ajoute un widget de tableau de bord **Qualité de l'air UBA**, trois
  déclencheurs de scène (**qualité de l'air dégradée**, **retour à la
  normale**, **polluant dégradé**) et une action de scène **Obtenir la qualité
  de l'air**.
- Trouve une station par son nom, sa ville ou son code, ou les plus proches de
  votre maison.

Lecture seule : l'intégration ne fait que lire des données publiques.

## Prérequis

- Gladys Assistant 5.3.0 ou plus récent.
- Un accès Internet de Gladys vers `luftdaten.umweltbundesamt.de`.
- Pour chercher autour de votre maison : sa position, dans **Paramètres →
  Maisons**.

## Configuration

### Choisir les stations

1. Ouvrez l'onglet **Configuration** de l'intégration.
2. Cliquez sur **Trouver une station** : saisissez un nom, une ville ou un code
   de station (`Köln`, `Munchen`, `DEBE010` : les accents sont facultatifs), ou
   laissez vide pour lister les stations actives les plus proches de votre
   maison, avec leur distance.
3. Recopiez les numéros voulus dans **Stations**, séparés par des virgules :
   par exemple `121, 21`. Enregistrez.
4. Dans l'onglet **Découverte**, ajoutez les stations à Gladys.

La [carte des stations](https://www.umweltbundesamt.de/daten/luft/luftdaten/luftqualitaet)
les montre toutes.

### Autres réglages

- **Relevé** : toutes les 30 minutes (par défaut) ou toutes les heures. L'UBA
  publie chaque heure une fois transmise par les Länder, souvent une à deux
  heures plus tard : lire plus souvent n'apporterait rien.
- **Langue** : langue des noms de fonctionnalités (fixés à l'ajout d'un
  appareil : choisissez-la d'abord) et des textes de scène. Français par
  défaut.

Le bouton **Vérifier les stations** lit chaque station tout de suite et dit ce
que chacune répond.

## Appareils

Un appareil par station, nommé `UBA <station>`.

| Fonctionnalité             | Valeurs                                                |
| -------------------------- | ------------------------------------------------------ |
| Indice de qualité de l'air | 0 à 4 (indice allemand, ci-dessous)                    |
| Qualité de l'air           | le niveau en toutes lettres, dans votre langue         |
| PM2.5, PM10, NO₂, O₃, SO₂  | µg/m³, les valeurs qui servent au calcul de l'indice   |
| Âge de la mesure           | minutes depuis la fin de l'heure des dernières données |

Seuls les polluants que la station mesure sont créés. NO₂, O₃ et SO₂ sont des
moyennes horaires ; PM10 et PM2.5 sont des moyennes sur 24 heures mises à jour
chaque heure, comme l'UBA les utilise pour l'indice.

L'**indice allemand de qualité de l'air** a cinq niveaux : 0 Très bon (sehr
gut), 1 Bon (gut), 2 Modéré (mäßig), 3 Mauvais (schlecht), 4 Très mauvais
(sehr schlecht). L'UBA le calcule chaque heure à partir de NO₂, O₃, PM10, PM2.5
et SO₂ ; le pire polluant le fixe.

Une valeur de plus de 3 heures n'est plus publiée comme actuelle : Gladys garde
la dernière avec sa date, et le widget indique que les données sont périmées.

## Widget

**Qualité de l'air UBA** :

- avec une station choisie : jusqu'à quatre tuiles de polluants, le niveau de
  l'indice en couleur (vert, orange, rouge) et l'âge des données ;
- sans : une ligne par station, son niveau en couleur.

Le réglage **Masquer** retire les tuiles des polluants, la ligne de l'âge ou la
ligne de source.

## Scènes

### Déclencheur : UBA : qualité de l'air dégradée

Se déclenche quand l'indice d'une station passe à **Modéré** ou pire, ou
s'aggrave encore (Modéré puis Mauvais déclenche deux fois). Filtres : la
station, et le **nouveau niveau** : cochez les niveaux à partir de votre seuil
(par exemple Mauvais et Très mauvais). Informations pour les actions : nom de
la station, niveau, son indice, l'indice précédent, le polluant qui fixe le
niveau, un résumé tout prêt.

### Déclencheur : UBA : retour à la normale

Se déclenche quand l'indice revient à **Bon** ou **Très bon** après une
dégradation. Filtres : la station, et le pire niveau atteint par la
dégradation (cochez les mêmes niveaux que ci-dessus pour apparier les deux
scènes). Informations : le nouveau niveau, le pire niveau atteint, un résumé.

### Déclencheur : UBA : polluant dégradé

Se déclenche quand le sous-indice d'**un polluant** passe à **Modéré** ou pire,
ou s'aggrave encore : l'ozone un après-midi d'été, les PM10 un soir d'hiver.
Filtres : la station, les polluants, le nouveau niveau. Informations : nom de
la station, polluant, niveau, son indice, la valeur en µg/m³, un résumé.

Le premier indice lu après l'installation fixe les niveaux de départ et ne
déclenche rien ; un redémarrage ne déclenche pas deux fois le même changement.

### Action : UBA : obtenir la qualité de l'air

La qualité de l'air d'une station, ou de la station dont l'indice est le pire :
résumé, niveau, indice, polluant, PM2.5, PM10, NO₂, O₃, SO₂ et l'âge des
données, pour les actions suivantes (un message, une condition).

## Exemples de scènes

- **Fermer les fenêtres** : déclencheur _qualité de l'air dégradée_ avec les
  niveaux Mauvais et Très mauvais → envoyer `{{triggerEvent.data.summary}}` et
  couper la ventilation.
- **Aérer à nouveau** : déclencheur _retour à la normale_ avec les mêmes
  niveaux → envoyer « Vous pouvez rouvrir les fenêtres ».
- **Alerte ozone** : déclencheur _polluant dégradé_ avec O₃ et les niveaux à
  partir de Modéré → fermer les volets et envoyer un message.
- **Point du matin** : à 7 h 30, action _obtenir la qualité de l'air_ sans
  station, puis envoyer son résumé dans le message du matin.
- **Votre propre seuil** : quand la fonctionnalité PM2.5 de votre station
  dépasse 25 µg/m³, allumer le purificateur d'air (déclencheur d'appareil de
  Gladys).

## Dépannage

- **« Aucune station »** sur l'écran Configuration : saisissez au moins un
  numéro de station dans **Stations**.
- **« pas une station de l'UBA »** dans la vérification : ce numéro n'est pas
  un identifiant de station de l'UBA ; utilisez **Trouver une station** (le
  numéro, pas le code comme `DEBE010`).
- **« aucune donnée depuis 24 heures »** : la station est fermée ou en panne ; la
  recherche ne liste que les stations actives.
- **Un polluant manque** : la station ne le mesure pas (beaucoup de stations
  n'ont ni ozone ni SO₂).
- **« L'API de l'UBA ne répond pas »** : les valeurs sont gardées et relues au
  relevé suivant. L'onglet Journaux signale l'erreur une fois, et sa fin.
- Détails dans l'onglet **Journaux** de l'intégration (`LOG_LEVEL=debug` pour
  plus).

## Limites

- Données horaires, transmises à l'UBA par les Länder avec un délai : les
  valeurs ont 1 à 2 heures de retard, et celles de l'année en cours ne sont pas
  encore validées.
- Ce sont des mesures, pas des prévisions.
- L'UBA ne publie aucun quota de requêtes : l'intégration lit 10 stations au
  plus, une requête par station et par relevé, et la liste des stations une
  fois par jour.
- Les déclencheurs suivent l'indice horaire de l'UBA tel qu'il est publié : un
  indice qui hésite entre deux niveaux déclenche chaque changement.
